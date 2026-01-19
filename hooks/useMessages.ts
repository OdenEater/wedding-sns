import messages from '@/messages/ja.json'

type Messages = typeof messages

/**
 * メッセージを取得するカスタムフック
 * 将来的に多言語対応する際は、ロケールを引数で受け取る
 */
export function useMessages(): Messages {
  return messages
}

/**
 * プレースホルダーを置換する関数
 * 例: "返信を表示 ({count})" → "返信を表示 (3)"
 */
export function formatMessage(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key]?.toString() || match
  })
}
