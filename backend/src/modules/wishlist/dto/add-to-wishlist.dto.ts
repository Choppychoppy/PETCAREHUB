import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddToWishlistDto {
  @ApiProperty({
    example: 'uuid-product-id',
    description: 'Product ID to add to wishlist',
  })
  @IsUUID()
  productId: string;
}