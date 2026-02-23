import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChatbotService } from './chatbot.service';

interface ChatMessageDto {
  message: string;
  history?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

@ApiTags('Chatbot')
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Send a message to the chatbot' })
  @ApiResponse({ status: 200, description: 'Chatbot response' })
  async chat(@Body() chatMessageDto: ChatMessageDto) {
    const response = await this.chatbotService.chat(
      chatMessageDto.message,
      chatMessageDto.history || [],
    );

    return {
      success: true,
      response,
    };
  }

  @Get('welcome')
  @ApiOperation({ summary: 'Get chatbot welcome message' })
  @ApiResponse({ status: 200, description: 'Welcome message' })
  async getWelcome() {
    const message = await this.chatbotService.getWelcomeMessage();
    return {
      success: true,
      message,
    };
  }
}
