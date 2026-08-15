import { toast, type ToastPosition } from 'react-toastify'

export const sucess_toast = (message: string, position?: ToastPosition) => {
  toast.success(message, {
    position: position ?? 'top-right',
  })
}

export const error_toast = (message: string, position?: ToastPosition) => {
  toast.error(message, {
    position: position ?? 'top-right',
  })
}

export const warn_toast = (message: string, position?: ToastPosition) => {
  toast.warn(message, {
    position: position ?? 'top-right',
  })
}

export const info_toast = (message: string, position?: ToastPosition) => {
  toast.info(message, {
    position: position ?? 'top-right',
  })
}
