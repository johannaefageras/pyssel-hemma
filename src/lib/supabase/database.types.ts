/*
 * The database as TypeScript, written by hand to match the files in
 * supabase/migrations.
 *
 * Once the Supabase CLI is linked to the project, this file can be generated
 * instead: `npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts`
 *
 * members.email, members.password_login_since and members.created_at are left out on
 * purpose: the API roles have no access to those columns.
 */

export type Database = {
	public: {
		Tables: {
			members: {
				Row: {
					id: string;
					name: string;
					colour: string;
				};
				Insert: never;
				Update: never;
				Relationships: [];
			};
			grocery_items: {
				Row: {
					id: string;
					name: string;
					quantity: string | null;
					aisle: string;
					added_by: string | null;
					picked: boolean;
					created_at: string;
				};
				Insert: {
					id?: string;
					name: string;
					quantity?: string | null;
					aisle?: string;
					added_by?: string | null;
					picked?: boolean;
					created_at?: string;
				};
				Update: {
					name?: string;
					quantity?: string | null;
					aisle?: string;
					picked?: boolean;
				};
				Relationships: [];
			};
			dinner_answers: {
				Row: {
					day: string;
					member_id: string;
					answer: 'in' | 'out';
				};
				Insert: {
					day: string;
					member_id?: string;
					answer: 'in' | 'out';
				};
				Update: {
					day?: string;
					member_id?: string;
					answer?: 'in' | 'out';
				};
				Relationships: [];
			};
		};
		Views: { [_ in never]: never };
		Functions: {
			current_member_id: {
				Args: Record<PropertyKey, never>;
				Returns: string | null;
			};
			is_house_email: {
				Args: { candidate: string };
				Returns: boolean;
			};
			enable_password_login: {
				Args: Record<PropertyKey, never>;
				Returns: undefined;
			};
		};
		Enums: { [_ in never]: never };
		CompositeTypes: { [_ in never]: never };
	};
};

export type Tables<Name extends keyof Database['public']['Tables']> =
	Database['public']['Tables'][Name]['Row'];
