import { ArrayNotEmpty, IsString, ValidateNested } from 'class-validator';

export class CreateOrderDTO {
  @ArrayNotEmpty()
  @IsString({ each: true })
  productIds: string[];
}
