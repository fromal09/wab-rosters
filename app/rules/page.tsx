'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

// Minimal markdown renderer — handles WAB rules structure
function renderMarkdown(md: string): React.ReactNode[] {
  const lines = md.split('\n')
  const nodes: React.ReactNode[] = []
  let i = 0
  let listBuffer: string[] = []
  let listDepth = 0

  function flushList() {
    if (!listBuffer.length) return
    nodes.push(
      <ul key={`ul-${nodes.length}`} style={{ paddingLeft: 20, margin: '6px 0 10px' }}>
        {listBuffer.map((item, idx) => {
          const depth = item.match(/^(\s*)/)?.[1].length ?? 0
          const text = item.replace(/^\s*-\s*/, '')
          return (
            <li key={idx} style={{ fontSize: '0.88rem', color: '#374151', lineHeight: 1.7, marginLeft: depth > 0 ? 16 : 0, listStyleType: depth > 0 ? 'circle' : 'disc', marginBottom: 2 }}>
              <span dangerouslySetInnerHTML={{ __html: renderInline(text) }} />
            </li>
          )
        })}
      </ul>
    )
    listBuffer = []
  }

  function renderInline(text: string): string {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code style="background:#f0f2f5;padding:1px 5px;border-radius:3px;font-size:0.85em">$1</code>')
  }

  while (i < lines.length) {
    const line = lines[i]

    // HR
    if (/^---+$/.test(line.trim())) {
      flushList()
      nodes.push(<hr key={`hr-${i}`} style={{ border: 'none', borderTop: '1px solid #e4e7ec', margin: '22px 0' }} />)
      i++; continue
    }

    // H1
    if (line.startsWith('# ')) {
      flushList()
      nodes.push(<h1 key={`h1-${i}`} style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f1117', marginBottom: 4, letterSpacing: '-0.02em' }}>{line.slice(2)}</h1>)
      i++; continue
    }

    // H2
    if (line.startsWith('## ')) {
      flushList()
      nodes.push(
        <h2 key={`h2-${i}`} style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f1117', marginTop: 22, marginBottom: 10, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 4, height: 16, background: '#1a56db', borderRadius: 2, display: 'inline-block', flexShrink: 0 }} />
          {line.slice(3)}
        </h2>
      )
      i++; continue
    }

    // H3
    if (line.startsWith('### ')) {
      flushList()
      nodes.push(<h3 key={`h3-${i}`} style={{ fontSize: '0.88rem', fontWeight: 700, color: '#374151', marginTop: 14, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{line.slice(4)}</h3>)
      i++; continue
    }

    // Table
    if (line.trim().startsWith('|') && i + 1 < lines.length && lines[i + 1].trim().startsWith('|---')) {
      flushList()
      const headerCells = line.split('|').map(c => c.trim()).filter(Boolean)
      i += 2 // skip header and separator
      const tableRows: string[][] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableRows.push(lines[i].split('|').map(c => c.trim()).filter(Boolean))
        i++
      }
      nodes.push(
        <div key={`tbl-${i}`} style={{ overflowX: 'auto', margin: '12px 0' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: '0.82rem', width: 'auto' }}>
            <thead>
              <tr>{headerCells.map((h, j) => <th key={j} style={{ padding: '5px 12px', background: '#f6f7f9', border: '1px solid #e4e7ec', fontWeight: 700, color: '#374151', textAlign: 'center' }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {tableRows.map((row, ri) => (
                <tr key={ri} style={{ background: ri % 2 === 0 ? '#fff' : '#f8f9fb' }}>
                  {row.map((cell, ci) => <td key={ci} style={{ padding: '4px 12px', border: '1px solid #e4e7ec', textAlign: 'center', color: '#374151', fontVariantNumeric: 'tabular-nums' }}>{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
      continue
    }

    // List item
    if (/^\s*-\s/.test(line)) {
      listBuffer.push(line)
      i++; continue
    }

    // Blank line — flush list, add spacing
    if (line.trim() === '') {
      flushList()
      i++; continue
    }

    // Paragraph
    flushList()
    if (line.trim()) {
      nodes.push(
        <p key={`p-${i}`} style={{ fontSize: '0.88rem', color: '#374151', lineHeight: 1.7, margin: '6px 0' }}
          dangerouslySetInnerHTML={{ __html: renderInline(line) }} />
      )
    }
    i++
  }
  flushList()
  return nodes
}

export default function RulesPage() {
  const [content, setContent] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/rules')
      .then(r => r.json())
      .then(d => { setContent(d.content ?? ''); setUpdatedAt(d.updated_at ?? null) })
      .finally(() => setLoading(false))
  }, [])

  const lastUpdated = updatedAt
    ? new Date(updatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 18, fontSize: '0.8rem', color: '#9ca3af' }}>
        <Link href="/" style={{ color: '#6b7280', textDecoration: 'none' }}>League</Link>
        <span style={{ margin: '0 6px', color: '#d1d5db' }}>›</span>
        <span style={{ color: '#374151', fontWeight: 500 }}>Rules</span>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>Loading…</div>}

      {!loading && content && (
        <div className="card" style={{ padding: '28px 32px' }}>
          {lastUpdated && (
            <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginBottom: 20, textAlign: 'right' }}>
              Last updated {lastUpdated}
            </div>
          )}
          {renderMarkdown(content)}
        </div>
      )}

      {!loading && !content && (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
          No rules content yet. Add it via the Commissioner panel.
        </div>
      )}
    </div>
  )
}
