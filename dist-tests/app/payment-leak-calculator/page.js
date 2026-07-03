"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PaymentLeakCalculatorRedirect;
const navigation_1 = require("next/navigation");
function PaymentLeakCalculatorRedirect() {
    (0, navigation_1.redirect)("/tools/payment-leak-calculator");
}
