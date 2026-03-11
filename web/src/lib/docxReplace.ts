import PizZip from 'pizzip'

/**
 * Replace text inside a DOCX binary (Uint8Array).
 *
 * Word splits visible text across multiple <w:r> runs within a <w:p> paragraph,
 * so a naive regex on individual <w:t> won't match cross-run strings.
 *
 * Strategy per paragraph:
 *   1. Collect every <w:t> node and concatenate their text → flat string.
 *   2. Run the search/replace on the flat string.
 *   3. Redistribute the new text back into the original <w:t> nodes
 *      (fill first node with full result, clear the rest).
 */

type ReplaceResult = {
  /** Modified DOCX as Uint8Array (base64-ready). */
  data: Uint8Array
  /** Number of replacements performed. */
  count: number
}

const XML_FILES = ['word/document.xml', 'word/header1.xml', 'word/header2.xml', 'word/header3.xml', 'word/footer1.xml', 'word/footer2.xml', 'word/footer3.xml']

export function replaceTextInDocx(
  docxBinary: Uint8Array,
  search: string,
  replacement: string,
  replaceAll = true,
): ReplaceResult {
  const zip = new PizZip(docxBinary)
  let totalCount = 0

  for (const xmlPath of XML_FILES) {
    const file = zip.file(xmlPath)
    if (!file) continue

    const xml = file.asText()
    const { result, count } = replaceInXml(xml, search, replacement, replaceAll)
    if (count > 0) {
      zip.file(xmlPath, result)
      totalCount += count
    }
    if (!replaceAll && totalCount > 0) break
  }

  const out = zip.generate({ type: 'uint8array', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
  return { data: out, count: totalCount }
}

function replaceInXml(xml: string, search: string, replacement: string, replaceAll: boolean): { result: string; count: number } {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'application/xml')

  const ns = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
  const paragraphs = doc.getElementsByTagNameNS(ns, 'p')
  let count = 0

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i]
    const textNodes = collectTextNodes(para, ns)
    if (textNodes.length === 0) continue

    const flat = textNodes.map((t) => t.textContent ?? '').join('')
    if (!flat.includes(search)) continue

    let replaced: string
    if (replaceAll) {
      const parts = flat.split(search)
      count += parts.length - 1
      replaced = parts.join(replacement)
    } else {
      const idx = flat.indexOf(search)
      if (idx === -1) continue
      replaced = flat.slice(0, idx) + replacement + flat.slice(idx + search.length)
      count += 1
    }

    // Put entire result into first <w:t>, clear the rest.
    // Preserve xml:space="preserve" so leading/trailing spaces render.
    textNodes[0].textContent = replaced
    textNodes[0].setAttribute('xml:space', 'preserve')
    for (let j = 1; j < textNodes.length; j++) {
      textNodes[j].textContent = ''
    }

    if (!replaceAll && count > 0) break
  }

  const serializer = new XMLSerializer()
  return { result: serializer.serializeToString(doc), count }
}

function collectTextNodes(para: Element, ns: string): Element[] {
  const runs = para.getElementsByTagNameNS(ns, 'r')
  const result: Element[] = []
  for (let i = 0; i < runs.length; i++) {
    const ts = runs[i].getElementsByTagNameNS(ns, 't')
    for (let j = 0; j < ts.length; j++) {
      result.push(ts[j])
    }
  }
  return result
}

export function docxBase64ToUint8(content: string): Uint8Array {
  const b64 = content.startsWith('data:') ? content.split(',')[1] ?? '' : content
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
}

export function uint8ToBase64(data: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i])
  }
  return btoa(binary)
}
