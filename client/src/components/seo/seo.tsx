import { useEffect } from "react";

interface SEOProps {
    title?: string;
    description?: string;
    canonical?: string;
    ogType?: string;
    ogImage?: string;
    twitterHandle?: string;
}

const DEFAULT_TITLE = "KIZERE - Item Registration & Management Platform";
const DEFAULT_DESCRIPTION = "Register and protect your valuable items with KIZERE. The leading digital asset recovery platform in Rwanda.";

export function SEO({
    title,
    description,
    canonical,
    ogType = "website",
    ogImage,
    twitterHandle = "@kizere_inc"
}: SEOProps) {
    useEffect(() => {
        // Update Title
        const fullTitle = title ? `${title} | KIZERE` : DEFAULT_TITLE;
        document.title = fullTitle;

        // Update Meta Description
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute("content", description || DEFAULT_DESCRIPTION);
        } else {
            const meta = document.createElement("meta");
            meta.name = "description";
            meta.content = description || DEFAULT_DESCRIPTION;
            document.head.appendChild(meta);
        }

        // Update Open Graph tags
        updateMetaTag("og:title", fullTitle);
        updateMetaTag("og:description", description || DEFAULT_DESCRIPTION);
        updateMetaTag("og:type", ogType);
        if (ogImage) updateMetaTag("og:image", ogImage);

        // Update Twitter tags
        updateMetaTag("twitter:card", "summary_large_image");
        updateMetaTag("twitter:site", twitterHandle);
        updateMetaTag("twitter:title", fullTitle);
        updateMetaTag("twitter:description", description || DEFAULT_DESCRIPTION);

        // Update Canonical link
        if (canonical) {
            let link = document.querySelector('link[rel="canonical"]');
            if (link) {
                link.setAttribute("href", canonical);
            } else {
                link = document.createElement("link");
                link.setAttribute("rel", "canonical");
                link.setAttribute("href", canonical);
                document.head.appendChild(link);
            }
        }
    }, [title, description, canonical, ogType, ogImage, twitterHandle]);

    return null;
}

function updateMetaTag(property: string, content: string) {
    let element = document.querySelector(`meta[property="${property}"]`) ||
        document.querySelector(`meta[name="${property}"]`);

    if (element) {
        element.setAttribute("content", content);
    } else {
        element = document.createElement("meta");
        if (property.startsWith("og:")) {
            element.setAttribute("property", property);
        } else {
            element.setAttribute("name", property);
        }
        element.setAttribute("content", content);
        document.head.appendChild(element);
    }
}
