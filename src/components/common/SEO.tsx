import { useEffect } from "react"
import { ENV } from "../../config/env"

interface SEOProps {
  title: string
  description?: string
  canonical?: string
  ogImage?: string
  ogType?: "website" | "article"
  structuredData?: Record<string, any>
}

const DEFAULT_DESCRIPTION =
  "CampusRecover AI is the enterprise lost-and-found recovery ecosystem for university campuses. Features AI multimodal matching, OCR serial extraction, real-time messaging, and secure multi-factor physical handover."

export function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  ogImage = `${ENV.VITE_APP_URL}/og-image.png`,
  ogType = "website",
  structuredData,
}: SEOProps) {
  const fullTitle = `${title} | CampusRecover AI`
  const currentUrl =
    typeof window !== "undefined" ? window.location.href : ENV.VITE_APP_URL

  useEffect(() => {
    // 1. Update Title
    document.title = fullTitle

    // Helper to set or create meta tag
    const setMetaTag = (
      attr: "name" | "property",
      key: string,
      content: string,
    ) => {
      let element = document.querySelector(`meta[${attr}="${key}"]`)
      if (!element) {
        element = document.createElement("meta")
        element.setAttribute(attr, key)
        document.head.appendChild(element)
      }
      element.setAttribute("content", content)
    }

    // 2. Standard Meta Tags
    setMetaTag("name", "description", description)

    // 3. Open Graph
    setMetaTag("property", "og:title", fullTitle)
    setMetaTag("property", "og:description", description)
    setMetaTag("property", "og:type", ogType)
    setMetaTag("property", "og:url", canonical || currentUrl)
    setMetaTag("property", "og:image", ogImage)
    setMetaTag("property", "og:site_name", "CampusRecover AI")

    // 4. Twitter Cards
    setMetaTag("name", "twitter:card", "summary_large_image")
    setMetaTag("name", "twitter:title", fullTitle)
    setMetaTag("name", "twitter:description", description)
    setMetaTag("name", "twitter:image", ogImage)

    // 5. Canonical Link
    let linkCanonical = document.querySelector('link[rel="canonical"]')
    if (!linkCanonical) {
      linkCanonical = document.createElement("link")
      linkCanonical.setAttribute("rel", "canonical")
      document.head.appendChild(linkCanonical)
    }
    linkCanonical.setAttribute("href", canonical || currentUrl)

    // 6. JSON-LD Structured Data
    const defaultSchema = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "CampusRecover AI",
      applicationCategory: "UtilityApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      description,
    }

    const schemaData = structuredData || defaultSchema
    let scriptTag = document.querySelector(
      'script[type="application/ld+json"]#seo-schema',
    )
    if (!scriptTag) {
      scriptTag = document.createElement("script")
      scriptTag.setAttribute("type", "application/ld+json")
      scriptTag.setAttribute("id", "seo-schema")
      document.head.appendChild(scriptTag)
    }
    scriptTag.textContent = JSON.stringify(schemaData)
  }, [
    fullTitle,
    description,
    canonical,
    ogImage,
    ogType,
    structuredData,
    currentUrl,
  ])

  return null
}

export default SEO
