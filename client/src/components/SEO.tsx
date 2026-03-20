import { Helmet } from 'react-helmet-async';
import { useLocation } from 'wouter';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  schema?: Record<string, any> | Record<string, any>[];
}

export function SEO({
  title = "KIZERE - Item Registration & Management Platform",
  description = "Register, manage, and verify valuable items securely with KIZERE, Rwanda's trusted platform.",
  image = "https://kizere.rw/icons/icon-512x512.png",
  url,
  type = "website",
  schema
}: SEOProps) {
  const [location] = useLocation();
  const baseUrl = "https://kizere.rw";
  const canonicalUrl = url || `${baseUrl}${location}`;

  // Serialize schema safely
  const schemaString = schema ? JSON.stringify(schema) : null;

  return (
    <Helmet>
      {/* Basic metadata */}
      <title>{title}</title>
      <meta name="description" content={description} />
      
      {/* Canonical and Hreflang Tags */}
      <link rel="canonical" href={canonicalUrl} />
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />
      <link rel="alternate" hrefLang="en" href={canonicalUrl} />
      <link rel="alternate" hrefLang="rw" href={canonicalUrl} />
      
      {/* Open Graph metadata */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image.startsWith('http') ? image : `${baseUrl}${image}`} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={type} />
      
      {/* Twitter metadata */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@kizere_rw" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image.startsWith('http') ? image : `${baseUrl}${image}`} />
      
      {/* JSON-LD Structured Data */}
      {schemaString && (
        <script type="application/ld+json">
          {schemaString}
        </script>
      )}
    </Helmet>
  );
}
