import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LmsService } from './lms.service';
import { AuthRequest } from '../auth/strategies/jwt.strategy';
import { Public } from '../auth/guards/jwt-auth.guard';

@ApiTags('LMS Courses & Learning')
@Controller('courses')
export class LmsController {
  constructor(private readonly lmsService: LmsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all published courses' })
  async getCourses() {
    return this.lmsService.getCourses();
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get course curriculum, syllabus, and modules' })
  async getCourseBySlug(@Param('slug') slug: string) {
    return this.lmsService.getCourseBySlug(slug);
  }

  @Get(':slug/lessons/:lessonId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get lesson content and video playback (enforces plan entitlement)' })
  async getLessonContent(
    @Req() req: AuthRequest,
    @Param('slug') slug: string,
    @Param('lessonId') lessonId: string,
  ) {
    return this.lmsService.getLessonContent(req.user.id, slug, lessonId);
  }

  @Post(':slug/lessons/:lessonId/complete')
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark lesson complete and record progress' })
  async markLessonComplete(
    @Req() req: AuthRequest,
    @Param('lessonId') lessonId: string,
  ) {
    return this.lmsService.markLessonComplete(req.user.id, lessonId);
  }

  @Get(':slug/quiz')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get certification exam / quiz questions' })
  async getCourseQuiz(@Param('slug') slug: string) {
    return this.lmsService.getCourseQuiz(slug);
  }

  @Post(':slug/quiz/:quizId/submit')
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit quiz answers, get score and automatic certificate' })
  async submitQuiz(
    @Req() req: AuthRequest,
    @Param('quizId') quizId: string,
    @Body('answers') answers: Record<string, number>,
  ) {
    return this.lmsService.submitQuiz(req.user.id, quizId, answers || {});
  }

  @Get(':slug/certificate')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get course completion certificate details if passed' })
  async getCertificate(
    @Req() req: AuthRequest,
    @Param('slug') slug: string,
  ) {
    return this.lmsService.getCertificate(req.user.id, slug);
  }
}
