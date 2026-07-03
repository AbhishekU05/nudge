"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmailLinkErrorMessage = getEmailLinkErrorMessage;
function getEmailLinkErrorMessage(description) {
    const fallback = "Something went wrong. Please try again.";
    if (!description) {
        return fallback;
    }
    const normalized = description.replace(/\+/g, " ").trim().toLowerCase();
    // If it specifically says expired or invalid, we can optionally provide a slightly better message
    // but since the user requested "Something went wrong" for all errors, we will just return the fallback.
    return fallback;
}
