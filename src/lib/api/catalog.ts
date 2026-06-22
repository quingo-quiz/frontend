import { env } from '$env/dynamic/public';
import type { ApiResponse, ApiError } from '$lib/types/auth';
import type { CatalogItem, CatalogPage, UUID } from '$lib/types/quiz';

const BASE = `${env.PUBLIC_API_URL}/catalog`;

async function unwrap<T>(res: Response): Promise<T> {
	const result = await res.json();
	if (!res.ok) throw result as ApiError;
	return (result as ApiResponse<T>).data;
}

export const catalogService = {
	async list(params?: { q?: string; page?: number; size?: number }): Promise<CatalogPage> {
		const qs = new URLSearchParams();
		if (params?.q) qs.set('q', params.q);
		if (params?.page !== undefined) qs.set('page', String(params.page));
		if (params?.size !== undefined) qs.set('size', String(params.size));
		const res = await fetch(`${BASE}?${qs}`);
		return unwrap<CatalogPage>(res);
	},

	async get(id: UUID): Promise<CatalogItem> {
		const res = await fetch(`${BASE}/${id}`);
		return unwrap<CatalogItem>(res);
	}
};
