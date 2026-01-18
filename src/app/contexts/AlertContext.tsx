import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { CustomAlert } from "../components/CustomAlert";

type AlertType = "info" | "warning" | "error" | "success";

type AlertPayload = {
  title: string;
  message: string;
  type?: AlertType;
};

type AlertContextValue = {
  showAlert: (payload: AlertPayload) => void;
};

const AlertContext = createContext<AlertContextValue | undefined>(undefined);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alert, setAlert] = useState<
    (AlertPayload & { isOpen: boolean }) | null
  >(null);

  const showAlert = useCallback((payload: AlertPayload) => {
    setAlert({ ...payload, isOpen: true });
  }, []);

  const onClose = useCallback(() => {
    setAlert((prev) => (prev ? { ...prev, isOpen: false } : prev));
  }, []);

  useEffect(() => {
    const prevAlert = window.alert;
    window.alert = (message?: any) => {
      const msg =
        typeof message === "string"
          ? message
          : message != null
          ? String(message)
          : "";
      showAlert({ title: "알림", message: msg, type: "info" });
    };

    return () => {
      window.alert = prevAlert;
    };
  }, [showAlert]);

  const value = useMemo(() => ({ showAlert }), [showAlert]);

  return (
    <AlertContext.Provider value={value}>
      {children}
      <CustomAlert
        isOpen={!!alert?.isOpen}
        onClose={onClose}
        title={alert?.title || ""}
        message={alert?.message || ""}
        type={alert?.type}
      />
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return ctx;
}
