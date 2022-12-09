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
let SusImages = class SusImages {
    async sus(interaction) {
        try {
            await interaction.deferReply();
            const url = "https://api-projects.up.railway.app/images/sus/random?nsfw=false";
            const { data: { susImg } } = await axios.get(url);
            await interaction.followUp(`${susImg}`);
        }
        catch (error) {
            console.log(error);
            interaction.followUp(`An error has occurred, please try again later. in /sus`);
        }
    }
};
__decorate([
    Slash({ description: "Return a sus image", name: "sus" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CommandInteraction]),
    __metadata("design:returntype", Promise)
], SusImages.prototype, "sus", null);
SusImages = __decorate([
    Discord()
], SusImages);
export { SusImages };
