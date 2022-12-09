var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Discord, Slash, SlashOption } from "discordx";
import { CommandInteraction, ApplicationCommandOptionType, } from "discord.js";
let ConInputs = class ConInputs {
    ga(test, interaction) {
        interaction.reply(`${interaction.user.username} You said ${test}`);
    }
};
__decorate([
    Slash({ description: "Return a pong" }),
    __param(0, SlashOption({
        description: "Return a test message",
        name: "ping",
        required: true,
        type: ApplicationCommandOptionType.String,
    })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CommandInteraction]),
    __metadata("design:returntype", void 0)
], ConInputs.prototype, "ga", null);
ConInputs = __decorate([
    Discord()
], ConInputs);
export { ConInputs };
// @Discord()
// export class SoloSinNada {
//   @Slash({ description: "Return a cats images", name: "cats" })
//   cats(interaction: CommandInteraction) {
//     interaction.reply(`${interaction.user.username} `);
//   }
// }
