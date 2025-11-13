"use client";
import React, { createContext, useContext, useState, useCallback } from "react";

type PaletteChangeContextType = {
    notifyPaletteChange: () => void;
    paletteChangeSignal: number;
};

const PaletteChangeContext = createContext<PaletteChangeContextType>({
    notifyPaletteChange: () => { },
    paletteChangeSignal: 0,
});

export const usePaletteChange = () => useContext(PaletteChangeContext);

export const PaletteChangeProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const [paletteChangeSignal, setPaletteChangeSignal] = useState(0);

    const notifyPaletteChange = useCallback(() => {
        console.log("✅ Inside notifyPaletteChange");
        setPaletteChangeSignal((prev) => prev + 1);
    }, []);

    return (
        <PaletteChangeContext.Provider
            value={{ notifyPaletteChange, paletteChangeSignal }}
        >
            {children}
        </PaletteChangeContext.Provider>
    );
};
