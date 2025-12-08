import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CheckoutService } from './checkout.service';
import { CheckoutRequestDto } from './dto/checkout.dto';

@ApiTags('Checkout')
@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post()
  @ApiOperation({ summary: 'Finaliser une commande depuis un panier' })
  checkout(@Body() dto: CheckoutRequestDto) {
    return this.checkoutService.checkout(dto);
  }
}
