"use client";

import { create } from "zustand";
import { X, CheckCircle2, XCircle, Info } from "lucide-react";

type NotificationType = "success" | "error" | "info";

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  title?: string;
}

interface NotificationStore {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id">) => void;
  removeNotification: (id: string) => void;
}

const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  addNotification: (notification) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      notifications: [...state.notifications, { ...notification, id }],
    }));
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }));
    }, 4500);
  },
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}));

export const notify = {
  success: (message: string, title?: string) => useNotificationStore.getState().addNotification({ type: "success", message, title }),
  error: (message: string, title?: string) => useNotificationStore.getState().addNotification({ type: "error", message, title }),
  info: (message: string, title?: string) => useNotificationStore.getState().addNotification({ type: "info", message, title }),
};

const getEnterpriseStyles = (type: NotificationType) => {
  switch (type) {
    case "success":
      return {
        icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" strokeWidth={2.5} />,
        iconBgClass: "bg-emerald-50",
        iconRingClass: "ring-emerald-100",
        titleClass: "text-slate-900",
        messageClass: "text-slate-600",
      };
    case "error":
      return {
        icon: <XCircle className="h-5 w-5 text-rose-600" strokeWidth={2.5} />,
        iconBgClass: "bg-rose-50",
        iconRingClass: "ring-rose-100",
        titleClass: "text-slate-900",
        messageClass: "text-slate-600",
      };
    case "info":
    default:
      return {
        icon: <Info className="h-5 w-5 text-blue-600" strokeWidth={2.5} />,
        iconBgClass: "bg-blue-50",
        iconRingClass: "ring-blue-100",
        titleClass: "text-slate-900",
        messageClass: "text-slate-600",
      };
  }
};

export function NotificationContainer() {
  const { notifications, removeNotification } = useNotificationStore();

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col items-end gap-2.5 w-full max-w-sm pointer-events-none px-4 sm:px-0">
      {notifications.map((n) => {
        const { icon, iconBgClass, iconRingClass, titleClass, messageClass } = getEnterpriseStyles(n.type);
        
        return (
          <div
            key={n.id}
            className="pointer-events-auto w-full bg-white rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.08),0_0_1px_rgba(0,0,0,0.1)] border border-slate-200/60 backdrop-blur-sm animate-in slide-in-from-right-5 fade-in duration-200 ease-out"
          >
            <div className="flex items-start gap-3 p-4">
              {/* Icon with ring */}
              <div className={`flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full ${iconBgClass} ring-4 ${iconRingClass}`}>
                {icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-[13px] font-semibold ${titleClass} leading-tight tracking-tight`}>
                    {n.title || (n.type === "success" ? "Success" : n.type === "error" ? "Error" : "Information")}
                  </p>
                  
                  {/* Close button */}
                  <button
                    onClick={() => removeNotification(n.id)}
                    className="flex-shrink-0 -mt-0.5 -mr-1 h-6 w-6 inline-flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors duration-150"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </button>
                </div>
                
                <p className={`text-[13px] ${messageClass} mt-0.5 leading-[1.5] break-words`}>
                  {n.message}
                </p>
              </div>
            </div>
            
            {/* Bottom border accent */}
            <div className="h-[2px] bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
          </div>
        );
      })}
    </div>
  );
}
