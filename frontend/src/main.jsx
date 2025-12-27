import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import ErrorBoundary from "./ErrorBoundary";
import { PageSkeleton } from "./Skeletons";
import "./index.css";
import "./polyfills";

const FeedbackApp = lazy(() => import("./FeedbackApp"));

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Suspense fallback={<PageSkeleton />}>
        <FeedbackApp />
      </Suspense>
    </ErrorBoundary>
  </React.StrictMode>
);
