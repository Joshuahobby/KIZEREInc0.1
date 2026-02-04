import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { LuPlus, LuTrash2, LuArrowDown, LuCalendar, LuLoader } from 'react-icons/lu';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { cn } from '@/lib/utils';

export interface OwnershipDocument {
  id: string;
  file: File;
  title: string;
  date: string;
  description: string;
}

export interface OwnershipChainProps {
  onDocumentsChange: (documents: OwnershipDocument[]) => void;
  showHeader?: boolean;
}

export function OwnershipChain({ onDocumentsChange, showHeader = true }: OwnershipChainProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<OwnershipDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<{
    file: File | null;
    title: string;
    date: string;
    description: string;
  }>({
    file: null,
    title: '',
    date: '',
    description: '',
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Check if file is a PDF or image
    if (!file.type.match('application/pdf') && !file.type.match('image/')) {
      toast({
        title: t('error_title'),
        description: t('ownership_invalid_file_type'),
        variant: 'destructive',
      });
      return;
    }
    
    setCurrentDocument(prev => ({
      ...prev,
      file,
    }));
  };
  
  // Add new document to chain
  const addDocument = () => {
    if (!currentDocument.file || !currentDocument.title) {
      toast({
        title: t('error_title'),
        description: t('ownership_required_fields'),
        variant: 'destructive',
      });
      return;
    }
    
    const newDocument: OwnershipDocument = {
      id: Math.random().toString(36).substr(2, 9),
      file: currentDocument.file,
      title: currentDocument.title,
      date: currentDocument.date,
      description: currentDocument.description,
    };
    
    const updatedDocuments = [...documents, newDocument];
    setDocuments(updatedDocuments);
    onDocumentsChange(updatedDocuments);
    
    // Reset current document form
    setCurrentDocument({
      file: null,
      title: '',
      date: '',
      description: '',
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    toast({
      title: t('registration.ownership_document_added'),
      description: t('registration.ownership_document_added_desc'),
    });
  };
  
  // Remove document from chain
  const removeDocument = (id: string) => {
    const updatedDocuments = documents.filter(doc => doc.id !== id);
    setDocuments(updatedDocuments);
    onDocumentsChange(updatedDocuments);
    
    toast({
      title: t('registration.ownership_document_removed'),
      description: t('registration.ownership_document_removed_desc'),
    });
  };
  
  // Get file name to display
  const getFileName = (file: File | null) => {
    if (!file) return '';
    
    const name = file.name;
    if (name.length > 20) {
      return name.substring(0, 17) + '...';
    }
    return name;
  };
  
  return (
    <Card className={cn("w-full", !showHeader && "border-0 shadow-none bg-transparent")}>
      {showHeader && (
        <CardHeader>
          <CardTitle>{t('registration.ownership_title')}</CardTitle>
          <CardDescription>{t('registration.ownership_description')}</CardDescription>
        </CardHeader>
      )}
      <CardContent className="p-0 space-y-4">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest border-muted-foreground/20"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <LuLoader className="mr-2 h-3 w-3 animate-spin" />
                  {t('uploading')}
                </>
              ) : (
                <>
                  <LuPlus className="mr-2 h-3 w-3" />
                  Attach Document
                </>
              )}
            </Button>
            <input
              type="file"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="application/pdf,image/*"
              aria-label={t('registration.ownership_select_file')}
            />
            {currentDocument.file && (
              <div className="text-sm">
                {getFileName(currentDocument.file)}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="doc-title" className="text-[10px] font-black uppercase tracking-widest opacity-60">Title *</Label>
              <Input
                id="doc-title"
                placeholder="e.g. Purchase Receipt"
                className="h-9 text-xs rounded-xl"
                value={currentDocument.title}
                onChange={(e) => setCurrentDocument(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="doc-date" className="text-[10px] font-black uppercase tracking-widest opacity-60">Date</Label>
              <div className="relative">
                <Input
                  id="doc-date"
                  type="date"
                  className="h-9 text-xs rounded-xl pr-8"
                  value={currentDocument.date}
                  onChange={(e) => setCurrentDocument(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="doc-description" className="text-[10px] font-black uppercase tracking-widest opacity-60">Notes</Label>
            <Textarea
              id="doc-description"
              placeholder="Additional details..."
              className="text-xs rounded-xl min-h-[60px] resize-none"
              value={currentDocument.description}
              onChange={(e) => setCurrentDocument(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
            />
          </div>
          
          <Button 
            type="button"
            onClick={addDocument} 
            disabled={!currentDocument.file || !currentDocument.title || isUploading}
            className="w-full h-9 rounded-xl text-[10px] font-black uppercase tracking-widest bg-primary/20 text-primary hover:bg-primary/30 border border-primary/20"
          >
            <LuPlus className="mr-2 h-3 w-3" />
            Add to Chain
          </Button>
        </div>
        
        {documents.length > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="font-medium text-base">{t('registration.ownership_chain_title')}</h3>
              <div className="space-y-6">
                {documents.map((doc, index) => (
                  <div key={doc.id} className="relative pl-6 border-l-2 border-dashed pb-6 last:border-0 last:pb-0">
                    <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-primary" />
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{doc.title}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeDocument(doc.id)}
                          className="h-8 w-8 text-destructive"
                        >
                          <LuTrash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center text-sm text-muted-foreground">
                        <span>{getFileName(doc.file)}</span>
                        {doc.date && (
                          <span className="ml-2 pl-2 border-l">
                            {new Date(doc.date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      
                      {doc.description && (
                        <p className="text-sm text-muted-foreground">{doc.description}</p>
                      )}
                    </div>
                    
                    {index < documents.length - 1 && (
                      <div className="absolute -left-3 bottom-3 flex items-center justify-center">
                        <LuArrowDown className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          {documents.length > 0
            ? t('registration.ownership_documents_count', { count: documents.length })
            : t('registration.ownership_no_documents')}
        </div>
      </CardFooter>
    </Card>
  );
}