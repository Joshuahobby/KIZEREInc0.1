declare global {
  interface Navigator {
    serial: any;
  }
}

const COMMANDS = {
  INIT: new Uint8Array([0x1b, 0x40]), 
  ALIGN_LEFT: new Uint8Array([0x1b, 0x61, 0x00]),
  ALIGN_CENTER: new Uint8Array([0x1b, 0x61, 0x01]),
  ALIGN_RIGHT: new Uint8Array([0x1b, 0x61, 0x02]),
  BOLD_ON: new Uint8Array([0x1b, 0x45, 0x01]),
  BOLD_OFF: new Uint8Array([0x1b, 0x45, 0x00]),
  TEXT_DOUBLE_WID_H: new Uint8Array([0x1d, 0x21, 0x11]), 
  TEXT_NORMAL: new Uint8Array([0x1d, 0x21, 0x00]), 
  CUT_PAPER: new Uint8Array([0x1d, 0x56, 0x41, 0x00]), 
  LINE_FEED: new Uint8Array([0x0a]),
};

export class ThermalPrinterService {
  private port: any = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private encoder: TextEncoder;

  constructor() {
    this.encoder = new TextEncoder();
  }

  isSupported(): boolean {
    return "serial" in navigator;
  }

  async connect(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      this.port = await navigator.serial.requestPort();
      await this.port.open({ baudRate: 9600 });
      return true;
    } catch (err) {
      console.error("Failed to connect to printer", err);
      // Ensure any partially opened port is closed
      if (this.port) {
          try { await this.port.close(); } catch(e) {}
      }
      this.port = null;
      return false;
    }
  }

  async write(data: Uint8Array | string) {
    if (!this.port) throw new Error("Printer not connected");
    const writable = this.port.writable;
    if (!writable) throw new Error("Printer not writable");
    
    if (!this.writer) {
       this.writer = writable.getWriter();
    }

    const output = typeof data === "string" ? this.encoder.encode(data) : data;
    await this.writer!.write(output);
  }

  async printLabel(labelData: {
    productName: string;
    serialNumber: string;
    sku?: string;
    kizereId: string;
  }): Promise<boolean> {
    try {
      if (!this.port) {
        const connected = await this.connect();
        if (!connected) return false;
      }

      await this.write(COMMANDS.INIT);

      // Header line
      await this.write(COMMANDS.ALIGN_CENTER);
      await this.write(COMMANDS.BOLD_ON);
      await this.write("KIZERE\n");
      await this.write(COMMANDS.BOLD_OFF);
      await this.write(COMMANDS.LINE_FEED);

      // Product info
      await this.write(COMMANDS.ALIGN_LEFT);
      await this.write(`${labelData.productName}\n`);
      await this.write(`S/N: ${labelData.serialNumber}\n`);
      if (labelData.sku) {
        await this.write(`SKU: ${labelData.sku}\n`);
      }
      await this.write(`ID:  ${labelData.kizereId}\n`);
      await this.write(COMMANDS.LINE_FEED);

      // Code128 barcode via ESC/POS: GS k 73 n d1..dn
      await this.write(COMMANDS.ALIGN_CENTER);
      // Set barcode height = 60 dots
      await this.write(new Uint8Array([0x1d, 0x68, 0x3c]));
      // Set barcode width multiplier = 2
      await this.write(new Uint8Array([0x1d, 0x77, 0x02]));
      // Print HRI (human readable) below barcode
      await this.write(new Uint8Array([0x1d, 0x48, 0x02]));
      // Print Code128 barcode
      const barcodeData = this.encoder.encode(labelData.serialNumber);
      const barcodeCmd = new Uint8Array([0x1d, 0x6b, 0x49, barcodeData.length, ...barcodeData]);
      await this.write(barcodeCmd);
      await this.write(COMMANDS.LINE_FEED);
      await this.write(COMMANDS.LINE_FEED);

      // Cut
      await this.write(COMMANDS.CUT_PAPER);

      if (this.writer) {
        this.writer.releaseLock();
        this.writer = null;
      }
      return true;
    } catch (e) {
      console.error("Label print failed", e);
      if (this.writer) {
        try { this.writer.releaseLock(); } catch (err) {}
        this.writer = null;
      }
      return false;
    }
  }

  async printReceipt(receiptData: {
    header: string;
    items: { label: string; value: string }[];
    footer: string;
    url: string;
  }): Promise<boolean> {
    try {
      if (!this.port) {
        const connected = await this.connect();
        if (!connected) return false;
      }

      await this.write(COMMANDS.INIT);
      await this.write(COMMANDS.ALIGN_CENTER);
      await this.write(COMMANDS.BOLD_ON);
      await this.write(COMMANDS.TEXT_DOUBLE_WID_H);
      await this.write(receiptData.header + "\n");
      await this.write(COMMANDS.TEXT_NORMAL);
      await this.write(COMMANDS.BOLD_OFF);
      await this.write("\n------------------------------------------------\n\n");
      
      await this.write(COMMANDS.ALIGN_LEFT);
      for (const item of receiptData.items) {
          await this.write(`${item.label}: ${item.value}\n`);
      }
      
      await this.write("\n------------------------------------------------\n\n");
      await this.write(COMMANDS.ALIGN_CENTER);
      await this.write(receiptData.footer + "\n");
      await this.write(receiptData.url + "\n\n\n\n\n");

      await this.write(COMMANDS.CUT_PAPER);
      
      if (this.writer) {
          this.writer.releaseLock();
          this.writer = null;
      }
      return true;
    } catch (e) {
      console.error("Print failed", e);
      if (this.writer) {
         try { this.writer.releaseLock(); } catch(e) {}
         this.writer = null;
      }
      return false;
    }
  }

  async printShiftSummary(summary: {
    date: string;
    totalRegistrations: number;
    totalTransfers: number;
    totalReturns: number;
    totalStolenReports: number;
    totalTransactions: number;
    registrationsByCategory: { category: string; count: number }[];
  }): Promise<boolean> {
    try {
      if (!this.port) {
        const connected = await this.connect();
        if (!connected) return false;
      }

      await this.write(COMMANDS.INIT);
      await this.write(COMMANDS.ALIGN_CENTER);
      await this.write(COMMANDS.BOLD_ON);
      await this.write("DAILY SHIFT SUMMARY\n");
      await this.write(COMMANDS.BOLD_OFF);
      await this.write(`Date: ${new Date(summary.date).toLocaleDateString()}\n`);
      await this.write("\n------------------------------------------------\n\n");

      await this.write(COMMANDS.ALIGN_LEFT);
      await this.write(`Total Registrations:  ${summary.totalRegistrations}\n`);
      await this.write(`Total Transfers:      ${summary.totalTransfers}\n`);
      await this.write(`Total Returns:        ${summary.totalReturns}\n`);
      await this.write(`Total Stolen Reports: ${summary.totalStolenReports}\n`);
      await this.write(`Total Transactions:   ${summary.totalTransactions}\n`);

      if (summary.registrationsByCategory.length > 0) {
        await this.write("\n-- REGISTRATIONS BY CATEGORY --\n");
        for (const item of summary.registrationsByCategory) {
          await this.write(`${item.category.padEnd(20)}: ${item.count}\n`);
        }
      }

      await this.write("\n------------------------------------------------\n\n\n\n\n");
      await this.write(COMMANDS.CUT_PAPER);

      if (this.writer) {
        this.writer.releaseLock();
        this.writer = null;
      }
      return true;
    } catch (e) {
      console.error("Shift summary print failed", e);
      if (this.writer) {
        try { this.writer.releaseLock(); } catch(err) {}
        this.writer = null;
      }
      return false;
    }
  }
}

export const thermalPrinter = new ThermalPrinterService();
