import { env } from '$env/dynamic/public';
import type { ApiResponse } from '$lib/types/auth';
import type { UUID } from '$lib/types/auth';

export interface UserProfile {
	id: UUID;
	username: string;
	bio?: string;
}

const BASE = `${env.PUBLIC_API_URL}/auth/profile`;

async function unwrap<T>(res: Response): Promise<T> {
	const result = await res.json();
	if (!res.ok) throw result;
	return (result as ApiResponse<T>).data;
}

export const profileService = {
	async get(id: UUID): Promise<UserProfile> {
		const res = await fetch(`${BASE}/${id}`);
		return unwrap<UserProfile>(res);
	},

	async batch(ids: UUID[]): Promise<UserProfile[]> {
		if (ids.length === 0) return [];
		const res = await fetch(`${BASE}/batch`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(ids)
		});
		return unwrap<UserProfile[]>(res);
	}
};
