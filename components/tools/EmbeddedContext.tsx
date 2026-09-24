"use client";

import { createContext, useContext } from "react";

/** True inside a ToolHub: modules then skip their own ToolShell header. */
const EmbeddedContext = createContext(false);

export const EmbeddedProvider = EmbeddedContext.Provider;
export const useEmbedded = () => useContext(EmbeddedContext);
