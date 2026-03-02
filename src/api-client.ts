import { requestUrl } from "obsidian";

// --- Response types (matching @mdtolink/contracts schemas) ---

export interface DocumentResponse {
	content: string;
	createdAt: string;
	expiresAt: string | null;
	id: string;
	isPublic: boolean;
	slug: string;
	status: "active" | "expired" | "deleted";
	storageKey: string;
	title: string | null;
	updatedAt: string;
	urlType: "nanoid" | "user_scoped" | "subdomain";
	userId: string;
	viewCount: number;
}

export interface UserResponse {
	createdAt: string;
	email: string;
	emailVerified: boolean;
	id: string;
	image: string | null;
	name: string;
	stripeCustomerId: string | null;
	updatedAt: string;
	username: string | null;
}

export interface SubscriptionResponse {
	cancelAtPeriodEnd: boolean;
	id: string;
	periodEnd: string | null;
	periodStart: string | null;
	plan: "free" | "pro" | "publisher";
	status: string;
}

export interface CreateDocumentRequest {
	content: string;
	isPublic?: boolean;
	slug?: string;
	title?: string;
}

export interface UpdateDocumentRequest {
	content?: string;
	isPublic?: boolean;
	slug?: string;
	title?: string;
}

export interface ApiError {
	message: string;
}

// --- API Client ---

export class MDtoLinkApiError extends Error {
	constructor(
		public readonly status: number,
		message: string
	) {
		super(message);
		this.name = "MDtoLinkApiError";
	}
}

export class MDtoLinkClient {
	constructor(
		private serverUrl: string,
		private apiKey: string
	) {}

	private headers(): Record<string, string> {
		return {
			"Content-Type": "application/json",
			"x-api-key": this.apiKey,
		};
	}

	private async request<T>(
		method: string,
		path: string,
		body?: unknown
	): Promise<T> {
		const url = `${this.serverUrl}${path}`;
		try {
			const response = await requestUrl({
				url,
				method,
				headers: this.headers(),
				body: body !== undefined ? JSON.stringify(body) : undefined,
				throw: false,
			});

			if (response.status >= 400) {
				const errorBody = response.json as ApiError | undefined;
				throw new MDtoLinkApiError(
					response.status,
					errorBody?.message ?? `Request failed with status ${response.status}`
				);
			}

			return response.json as T;
		} catch (err) {
			if (err instanceof MDtoLinkApiError) {
				throw err;
			}
			// Obsidian's requestUrl throws on non-2xx — extract status if available
			const status = (err as Record<string, unknown>)?.status;
			if (typeof status === "number" && status >= 400) {
				throw new MDtoLinkApiError(
					status,
					(err as Error)?.message ?? `Request failed with status ${status}`
				);
			}
			throw err;
		}
	}

	async getMe(): Promise<UserResponse> {
		return await this.request<UserResponse>("GET", "/api/users/me");
	}

	async getSubscription(): Promise<SubscriptionResponse | null> {
		return await this.request<SubscriptionResponse | null>(
			"GET",
			"/api/billing/subscription"
		);
	}

	async createDocument(data: CreateDocumentRequest): Promise<DocumentResponse> {
		return await this.request<DocumentResponse>("POST", "/api/documents", data);
	}

	async updateDocument(
		id: string,
		data: UpdateDocumentRequest
	): Promise<DocumentResponse> {
		return await this.request<DocumentResponse>(
			"PATCH",
			`/api/documents/${id}`,
			data
		);
	}

	async deleteDocument(id: string): Promise<void> {
		await this.request<{ success: boolean }>("DELETE", `/api/documents/${id}`);
	}
}
