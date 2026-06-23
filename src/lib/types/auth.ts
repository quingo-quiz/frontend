// src/lib/types/auth.ts

// --- Базовые типы ---
export type UUID = string; // Для ясности, что это UUID
export type AccountStatus = 'ACTIVE' | 'BLOCKED' | 'DELETED';
export type Role = 'USER' | 'ADMIN';
export type MfaType = 'OTP';
export type OAuth2Provider = 'GOOGLE' | 'GITHUB';

// --- Общие DTO для ответов сервера ---
export interface ApiResponse<T> {
	status: number;
	statusMessage: string;
	message: string;
	data: T;
	timestamp: string;
}

export interface ApiError {
	status: number;
	message: string;
	path: string;
	method: string;
	timestamp: string;
	fieldErrors?: Record<string, string>; // Для ошибок валидации
	rejectedValues?: Record<string, any>;
	details?: Record<string, any>;
}

// --- Auth-Specific DTOs ---
export interface AuthRequest {
	email: string;
	password: string;
}

export interface RegisterRequest {
	username: string;
	email: string;
	password: string;
}

// Расширенная AuthResponseModel для логина (может вернуть токены или флаг MFA)
export interface AuthResponseModel {
	accessToken?: string;
	refreshToken?: string;
	mfaTempToken?: string; // При 403, для 2FA
	mfaRequired: boolean;
}

export interface OtpConnectDto {
	secretUri: string;
}

export interface OtpVerifyRequest {
	code: string;
	mfaTempToken?: string; // Опционально для подтверждения 2FA flow
}

export interface OtpDisableRequest {
	code: string; // Код для отключения 2FA
}

export interface RefreshTokenRequest {
	refresh_token: string;
}

// --- User-Specific DTOs ---

// Обновленная модель пользователя
export interface User {
	id: UUID;
	username: string;
	email: string;
	bio?: string; // Теперь опциональное поле
	roles: Role[];
	emailVerified: boolean;
	mfaEnabled: boolean;
	accountStatus: AccountStatus;
	passwordSet: boolean; // НОВОЕ: Установлен ли пароль
	avatarUrl?: string; // НОВОЕ: URL аватара (пока не используется, но поле есть)
}

// Запрос на обновление профиля
export interface UpdateUserRequest {
	username?: string;
	bio?: string;
}

// Запрос на смену пароля
export interface ChangePasswordRequest {
	oldPassword: string;
	newPassword: string;
}

// Запрос на установку пароля (если его не было)
export interface SetPasswordRequest {
	password: string;
}

// Запрос на отправку письма сброса пароля
export interface SendResetPasswordRequest {
	email: string;
}

// Запрос на сброс пароля
export interface ResetPasswordRequest {
	resetToken: string;
	newPassword: string;
}

// Запрос на подтверждение email
export interface VerifyEmailRequest {
	verificationToken: string;
}

// --- Session-Specific DTOs ---

// Расширенная модель сессии
export interface SessionModel {
	tokenId: UUID;
	sessionId: UUID;
	issuedAt: string; // ISO Date String
	loggedInAt: string; // ISO Date String
	expiresAt: string; // ISO Date String
	browser?: string;
	os?: string;
	device?: string;
	ipAddress?: string;
	isCurrent?: boolean; // НОВОЕ: Флаг для текущей сессии
}

// --- Security Status DTO ---
export interface SecurityStatusDto {
	userId: UUID;
	email: string;
	emailVerified: boolean;
	passwordSet: boolean;
	mfaEnabled: boolean;
	mfaTypes: MfaType[];
	roles: Role[];
	linkedProviders: OAuth2Provider[];
	accountStatus: AccountStatus;
}

// --- OAuth2 Callback DTO ---
export type OAuth2CallbackStatus = 'SUCCESS' | 'ERROR';
export type OAuth2CallbackCode =
	| 'OAUTH2_SUCCESS'
	| 'OAUTH2_FAILED'
	| 'EMAIL_ALREADY_USED'
	| 'USERNAME_TAKEN'
	| 'UNKNOWN_ERROR';

export interface OAuth2CallbackResult {
	status: OAuth2CallbackStatus;
	code?: OAuth2CallbackCode;
	message?: string;
}
