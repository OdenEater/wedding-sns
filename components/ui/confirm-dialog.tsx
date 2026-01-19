'use client'

import { Button } from './button'
import { AlertCircle } from 'lucide-react'

type ConfirmDialogProps = {
  title: string
  message: string
  confirmText: string
  cancelText: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'danger' | 'warning' | 'info'
}

export function ConfirmDialog({
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  variant = 'danger'
}: ConfirmDialogProps) {
  const variantStyles = {
    danger: 'bg-red-50 border-red-200',
    warning: 'bg-orange-50 border-orange-200',
    info: 'bg-blue-50 border-blue-200'
  }

  const iconStyles = {
    danger: 'text-red-500',
    warning: 'text-orange-500',
    info: 'text-blue-500'
  }

  const buttonStyles = {
    danger: 'bg-red-500 hover:bg-red-600',
    warning: 'bg-orange-500 hover:bg-orange-600',
    info: 'bg-blue-500 hover:bg-blue-600'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* オーバーレイ */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* ダイアログ */}
      <div className="relative bg-white rounded-lg shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
        {/* アイコンヘッダー */}
        <div className={`flex items-center gap-3 p-6 border-b ${variantStyles[variant]}`}>
          <div className={`p-2 rounded-full bg-white shadow-sm ${iconStyles[variant]}`}>
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>

        {/* メッセージ */}
        <div className="p-6">
          <p className="text-gray-600 leading-relaxed">{message}</p>
        </div>

        {/* アクションボタン */}
        <div className="flex gap-3 p-6 pt-0">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            className={`flex-1 ${buttonStyles[variant]} text-white`}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}
