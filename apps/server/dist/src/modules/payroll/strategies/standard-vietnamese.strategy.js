"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StandardVietnameseStrategy = void 0;
const common_1 = require("@nestjs/common");
let StandardVietnameseStrategy = class StandardVietnameseStrategy {
    calculateDeductions(grossSalary) {
        const insuranceRate = 0.105;
        return grossSalary * insuranceRate;
    }
    calculateTax(grossSalary) {
        const personalDeduction = 11000000;
        const taxableIncome = grossSalary - this.calculateDeductions(grossSalary) - personalDeduction;
        if (taxableIncome <= 0)
            return 0;
        return taxableIncome * 0.10;
    }
};
exports.StandardVietnameseStrategy = StandardVietnameseStrategy;
exports.StandardVietnameseStrategy = StandardVietnameseStrategy = __decorate([
    (0, common_1.Injectable)()
], StandardVietnameseStrategy);
//# sourceMappingURL=standard-vietnamese.strategy.js.map