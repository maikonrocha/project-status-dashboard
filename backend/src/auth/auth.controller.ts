import {
    Controller,
    Post,
    Get,
    Body,
    Request,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
    SignUpDto,
    CompleteSignUpDto,
    SignInDto,
    VerifyCodeDto,
    ResendCodeDto,
    InviteUserDto,
} from './dto/auth.dto';
import { Public } from './public.decorator';
import { Roles } from './roles.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Public()
    @Post('sign-up')
    @HttpCode(HttpStatus.CREATED)
    signUp(@Body() dto: SignUpDto) {
        return this.authService.signUpOwner(dto.name, dto.email, dto.password, dto.companyName);
    }

    @Public()
    @Post('sign-up/complete')
    @HttpCode(HttpStatus.OK)
    completeSignUp(@Body() dto: CompleteSignUpDto) {
        return this.authService.completeSignUp(dto.email, dto.name, dto.password);
    }

    @Public()
    @Post('sign-in')
    @HttpCode(HttpStatus.OK)
    signIn(@Body() dto: SignInDto) {
        return this.authService.signIn(dto.email, dto.password);
    }

    @Public()
    @Post('verify')
    @HttpCode(HttpStatus.OK)
    verify(@Body() dto: VerifyCodeDto) {
        return this.authService.verifyCode(dto.email, dto.code);
    }

    @Public()
    @Post('resend-code')
    @HttpCode(HttpStatus.OK)
    resendCode(@Body() dto: ResendCodeDto) {
        return this.authService.resendCode(dto.email);
    }

    @ApiBearerAuth()
    @Post('invite')
    @Roles('OWNER')
    @HttpCode(HttpStatus.CREATED)
    invite(@Request() req: any, @Body() dto: InviteUserDto) {
        return this.authService.inviteUser(req.user.id, dto.email);
    }

    @ApiBearerAuth()
    @Get('me')
    getMe(@Request() req: any) {
        return this.authService.getMe(req.user.id);
    }

    @ApiBearerAuth()
    @Get('users')
    @Roles('OWNER')
    getUsers(@Request() req: any) {
        return this.authService.getCompanyUsers(req.user.companyId);
    }
}
