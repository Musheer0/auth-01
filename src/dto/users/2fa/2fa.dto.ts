import { IsString, IsUUID } from "class-validator"

export class TwoFaDto {
    @IsString()
    @IsUUID()
    token:string

    @IsString()
    code:string
}