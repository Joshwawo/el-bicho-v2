var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Discord, Slash } from "discordx";
import { CommandInteraction, } from "discord.js";
import axios from "axios";
let Testing2 = class Testing2 {
    async cats(interaction) {
        await interaction.deferReply();
        try {
            const url = `https://aws.random.cat/meow`;
            const { data: { file } } = await axios.get(url);
            console.log(file);
            await interaction.followUp(`${file}`);
            // const url = "https://api.thecatapi.com/v1/images/search";
        }
        catch (error) {
            console.log(error);
            interaction.followUp(`An error has occurred, please try again later. in /cats`);
        }
    }
};
__decorate([
    Slash({ description: "Return a cats images", name: "cats" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CommandInteraction]),
    __metadata("design:returntype", Promise)
], Testing2.prototype, "cats", null);
Testing2 = __decorate([
    Discord()
], Testing2);
export { Testing2 };
