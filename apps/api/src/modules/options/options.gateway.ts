import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LiveTickDto } from '@ff/types';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/options',
})
export class OptionsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(OptionsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const authHeader = client.handshake.headers.authorization || client.handshake.auth?.token;
      let token = authHeader;
      if (token && token.startsWith('Bearer ')) {
        token = token.slice(7);
      }

      if (token) {
        const secret = this.configService.get<string>('JWT_SECRET');
        const payload = this.jwtService.verify(token, { secret });
        client.data.userId = payload.sub || payload.userId;
        client.data.email = payload.email;
        this.logger.log(`Authenticated client connected to Options WS: ${client.data.userId}`);
      } else {
        client.data.isGuest = true;
        this.logger.log(`Guest client connected to Options WS: ${client.id}`);
      }

      client.emit('connection_ack', {
        status: 'CONNECTED',
        timestamp: new Date().toISOString(),
        isGuest: !!client.data.isGuest,
      });
    } catch {
      // Allow fallback guest connection
      client.data.isGuest = true;
      client.emit('connection_ack', {
        status: 'CONNECTED_GUEST',
        timestamp: new Date().toISOString(),
      });
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from Options WS: ${client.id}`);
  }

  @SubscribeMessage('subscribe_chain')
  handleSubscribeChain(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { underlying: string },
  ) {
    const underlying = (data?.underlying || 'NIFTY').toUpperCase();
    const room = `chain:${underlying}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined room ${room}`);

    client.emit('subscription_success', {
      room,
      underlying,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('unsubscribe_chain')
  handleUnsubscribeChain(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { underlying: string },
  ) {
    const underlying = (data?.underlying || 'NIFTY').toUpperCase();
    const room = `chain:${underlying}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} left room ${room}`);
  }

  /**
   * Broadcasts a live tick to all clients in the corresponding underlying room
   */
  broadcastTick(underlying: string, tick: LiveTickDto) {
    if (this.server) {
      this.server.to(`chain:${underlying.toUpperCase()}`).emit('tick', tick);
    }
  }
}
