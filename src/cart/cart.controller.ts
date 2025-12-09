import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { CreateCartSessionDto } from './dto/create-cart-session.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle session panier' })
  create(@Body() createCartSessionDto: CreateCartSessionDto) {
    return this.cartService.createSession(createCartSessionDto);
  }

  @Get(':sessionId')
  @ApiOperation({
    summary: 'Récupérer un panier via son identifiant de session',
  })
  findOne(@Param('sessionId') sessionId: string) {
    return this.cartService.findBySessionId(sessionId);
  }

  @Put(':sessionId')
  @ApiOperation({ summary: 'Remplacer les lignes d’un panier' })
  update(
    @Param('sessionId') sessionId: string,
    @Body() updateCartDto: UpdateCartDto,
  ) {
    return this.cartService.replaceItems(sessionId, updateCartDto);
  }

  @Delete(':sessionId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Vider un panier' })
  async remove(@Param('sessionId') sessionId: string) {
    await this.cartService.clear(sessionId);
  }
}
