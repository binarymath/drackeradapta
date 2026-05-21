export const theme = {
    // Layout Containers
    layout: {
        sidebar: "lg:col-span-4 space-y-6 no-print",
        main: "lg:col-span-8 flex flex-col gap-4",
        card: "bg-white p-6 rounded-xl shadow border border-brown-200",
        header: "bg-white shadow-md border-b border-brown-200 sticky top-0 z-20 no-print",
        headerContainer: "max-w-6xl mx-auto px-4 h-16 flex items-center justify-between",
    },

    // Typography
    text: {
        title: "text-lg font-bold text-brown-900",
        subtitle: "text-sm font-bold text-brown-700",
        label: "block text-sm font-semibold mb-2 text-brown-800",
        small: "text-xs text-brown-600",
        link: "text-brown-600 hover:text-brown-800 hover:underline font-bold",
    },

    // Interactive Elements
    input: {
        text: "w-full p-2 bg-brown-50 border border-brown-200 rounded-lg text-sm text-brown-900 placeholder:text-brown-400 focus:border-brown-500 focus:ring-1 focus:ring-brown-500 outline-none transition-all",
        textarea: "w-full p-2 bg-brown-50 border border-brown-200 rounded-lg text-sm text-brown-900 placeholder:text-brown-400 h-16 resize-none focus:border-brown-500 focus:ring-1 focus:ring-brown-500 outline-none transition-all",
        select: "w-full border border-brown-300 rounded-lg p-2 text-sm text-brown-900 bg-white",
        checkbox: "rounded text-brown-600 focus:ring-brown-500",
    },

    button: {
        primary: "bg-brown-600 text-white hover:bg-brown-700 hover:shadow-lg shadow-md",
        secondary: "bg-brown-100 text-brown-800 hover:bg-brown-200 border border-brown-200",
        danger: "bg-red-100 text-red-700 hover:bg-red-200",
        icon: "p-2 rounded-lg bg-brown-50 hover:bg-brown-100 text-brown-600 transition-colors",
        base: "transition-all font-bold rounded-lg flex items-center justify-center gap-2",
    },

    // Specific Component Styles
    modal: {
        overlay: "fixed inset-0 z-50 flex items-center justify-center bg-brown-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200",
        container: "bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200",
        header: "p-4 border-b border-brown-100 flex items-center justify-between bg-brown-50",
        body: "p-6 space-y-4 overflow-y-auto flex-1 bg-brown-50/30",
        footer: "px-6 py-4 border-t border-brown-100 bg-white flex justify-end gap-3",
    },

    status: {
        success: "bg-green-100 text-green-800",
        warning: "bg-yellow-100 text-yellow-800",
        error: "bg-red-100 text-red-800",
        info: "bg-brown-50 border border-brown-100 text-brown-800",
        badge: "ml-2 px-2 py-1 text-xs font-bold rounded-full flex items-center gap-1 shadow-sm",
    }
};
