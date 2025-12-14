import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode
}

export function Input({ icon, className = '', ...props }: InputProps) {
    return (
        <div className="relative">
            {/*　iconがある場合、左側に配置　*/}
            {icon && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    {icon}
                </div>
            )}

            <input
                className={`
          flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm 
          ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium 
          placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 
          focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50
          ${icon ? 'pl-10' : ''} 
          ${className}
        `}
                {...props}
            />
        </div>
    )
}