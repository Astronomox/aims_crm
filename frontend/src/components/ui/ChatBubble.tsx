function renderMd(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)/gm, '<div style="padding-left:12px">• $1</div>')
    .replace(/\n/g, '<br/>')
}

export default function ChatBubble({ text }: { text: string }) {
  return (
    <div
      className="chat-bubble"
      dangerouslySetInnerHTML={{ __html: renderMd(text) }}
    />
  )
}
