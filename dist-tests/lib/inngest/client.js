"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inngest = void 0;
const inngest_1 = require("inngest");
// Create a client to send and receive events
exports.inngest = new inngest_1.Inngest({
    id: "duely",
});
