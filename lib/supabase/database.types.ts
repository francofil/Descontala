
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "alert_preferences": {
                  Row: {
                    "category_ids": (string)[],"product_ids": (string)[],"radius_km": number,"shopping_day": number,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category_ids"?: (string)[],"product_ids"?: (string)[],"radius_km"?: number,"shopping_day": number,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "category_ids"?: (string)[],"product_ids"?: (string)[],"radius_km"?: number,"shopping_day"?: number,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"categories": {
                  Row: {
                    "emoji": string,"id": string,"name": string,"slug": string,"sort": number
                  }
                  ComputedFields: never
                  Insert: {
                    "emoji"?: string,"id"?: string,"name": string,"slug": string,"sort"?: number
                  }
                  Update: {
                    "emoji"?: string,"id"?: string,"name"?: string,"slug"?: string,"sort"?: number
                  }
                  Relationships: [
                    
                  ]
                },"chains": {
                  Row: {
                    "color": string,"created_at": string,"highlights": string | null,"id": string,"logo_url": string | null,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "color"?: string,"created_at"?: string,"highlights"?: string | null,"id"?: string,"logo_url"?: string | null,"name": string
                  }
                  Update: {
                    "color"?: string,"created_at"?: string,"highlights"?: string | null,"id"?: string,"logo_url"?: string | null,"name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"merchant_settings": {
                  Row: {
                    "chain_id": string,"fee_per_redemption": number
                  }
                  ComputedFields: never
                  Insert: {
                    "chain_id": string,"fee_per_redemption"?: number
                  }
                  Update: {
                    "chain_id"?: string,"fee_per_redemption"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "merchant_settings_chain_id_fkey"
      columns: ["chain_id"]
isOneToOne: true
      referencedRelation: "chains"
      referencedColumns: ["id"]
    }
                  ]
                },"products": {
                  Row: {
                    "brand": string | null,"category_id": string,"created_at": string,"id": string,"name": string,"unit": string
                  }
                  ComputedFields: never
                  Insert: {
                    "brand"?: string | null,"category_id": string,"created_at"?: string,"id"?: string,"name": string,"unit": string
                  }
                  Update: {
                    "brand"?: string | null,"category_id"?: string,"created_at"?: string,"id"?: string,"name"?: string,"unit"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "products_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "chain_id": string | null,"created_at": string,"display_name": string | null,"id": string,"role": Database["public"]['Enums']["user_role"]
                  }
                  ComputedFields: never
                  Insert: {
                    "chain_id"?: string | null,"created_at"?: string,"display_name"?: string | null,"id": string,"role"?: Database["public"]['Enums']["user_role"]
                  }
                  Update: {
                    "chain_id"?: string | null,"created_at"?: string,"display_name"?: string | null,"id"?: string,"role"?: Database["public"]['Enums']["user_role"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "profiles_chain_id_fkey"
      columns: ["chain_id"]
isOneToOne: false
      referencedRelation: "chains"
      referencedColumns: ["id"]
    }
                  ]
                },"promotion_events": {
                  Row: {
                    "created_at": string,"id": number,"promotion_id": string,"type": Database["public"]['Enums']["event_type"],"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: never,"promotion_id": string,"type": Database["public"]['Enums']["event_type"],"user_id"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"id"?: never,"promotion_id"?: string,"type"?: Database["public"]['Enums']["event_type"],"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "promotion_events_promotion_id_fkey"
      columns: ["promotion_id"]
isOneToOne: false
      referencedRelation: "promotion_stats"
      referencedColumns: ["promotion_id"]
    },{
      foreignKeyName: "promotion_events_promotion_id_fkey"
      columns: ["promotion_id"]
isOneToOne: false
      referencedRelation: "promotions"
      referencedColumns: ["id"]
    }
                  ]
                },"promotion_stores": {
                  Row: {
                    "promotion_id": string,"store_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "promotion_id": string,"store_id": string
                  }
                  Update: {
                    "promotion_id"?: string,"store_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "promotion_stores_promotion_id_fkey"
      columns: ["promotion_id"]
isOneToOne: false
      referencedRelation: "promotion_stats"
      referencedColumns: ["promotion_id"]
    },{
      foreignKeyName: "promotion_stores_promotion_id_fkey"
      columns: ["promotion_id"]
isOneToOne: false
      referencedRelation: "promotions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "promotion_stores_store_id_fkey"
      columns: ["store_id"]
isOneToOne: false
      referencedRelation: "stores"
      referencedColumns: ["id"]
    }
                  ]
                },"promotions": {
                  Row: {
                    "category_id": string | null,"chain_id": string,"conditions": string | null,"created_at": string,"created_by": string | null,"description": string | null,"ends_at": string,"id": string,"max_redemptions": number | null,"product_id": string | null,"starts_at": string,"status": Database["public"]['Enums']["promo_status"],"title": string,"type": Database["public"]['Enums']["promo_type"],"updated_at": string,"value": number | null,"promotion_is_live": boolean | null
                  }
                  ComputedFields: "promotion_is_live"
                  Insert: {
                    "category_id"?: string | null,"chain_id": string,"conditions"?: string | null,"created_at"?: string,"created_by"?: string | null,"description"?: string | null,"ends_at": string,"id"?: string,"max_redemptions"?: number | null,"product_id"?: string | null,"starts_at"?: string,"status"?: Database["public"]['Enums']["promo_status"],"title": string,"type": Database["public"]['Enums']["promo_type"],"updated_at"?: string,"value"?: number | null
                  }
                  Update: {
                    "category_id"?: string | null,"chain_id"?: string,"conditions"?: string | null,"created_at"?: string,"created_by"?: string | null,"description"?: string | null,"ends_at"?: string,"id"?: string,"max_redemptions"?: number | null,"product_id"?: string | null,"starts_at"?: string,"status"?: Database["public"]['Enums']["promo_status"],"title"?: string,"type"?: Database["public"]['Enums']["promo_type"],"updated_at"?: string,"value"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "promotions_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "promotions_chain_id_fkey"
      columns: ["chain_id"]
isOneToOne: false
      referencedRelation: "chains"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "promotions_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"rate_limits": {
                  Row: {
                    "hits": number,"key": string,"window_start": string
                  }
                  ComputedFields: never
                  Insert: {
                    "hits"?: number,"key": string,"window_start": string
                  }
                  Update: {
                    "hits"?: number,"key"?: string,"window_start"?: string
                  }
                  Relationships: [
                    
                  ]
                },"redemption_codes": {
                  Row: {
                    "chain_id": string,"code": string,"created_at": string,"expires_at": string,"id": string,"promotion_id": string,"redeemed_at": string | null,"redeemed_by": string | null,"redeemed_store_id": string | null,"status": Database["public"]['Enums']["code_status"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "chain_id": string,"code": string,"created_at"?: string,"expires_at": string,"id"?: string,"promotion_id": string,"redeemed_at"?: string | null,"redeemed_by"?: string | null,"redeemed_store_id"?: string | null,"status"?: Database["public"]['Enums']["code_status"],"user_id": string
                  }
                  Update: {
                    "chain_id"?: string,"code"?: string,"created_at"?: string,"expires_at"?: string,"id"?: string,"promotion_id"?: string,"redeemed_at"?: string | null,"redeemed_by"?: string | null,"redeemed_store_id"?: string | null,"status"?: Database["public"]['Enums']["code_status"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "redemption_codes_chain_id_fkey"
      columns: ["chain_id"]
isOneToOne: false
      referencedRelation: "chains"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "redemption_codes_promotion_id_fkey"
      columns: ["promotion_id"]
isOneToOne: false
      referencedRelation: "promotion_stats"
      referencedColumns: ["promotion_id"]
    },{
      foreignKeyName: "redemption_codes_promotion_id_fkey"
      columns: ["promotion_id"]
isOneToOne: false
      referencedRelation: "promotions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "redemption_codes_redeemed_store_id_fkey"
      columns: ["redeemed_store_id"]
isOneToOne: false
      referencedRelation: "stores"
      referencedColumns: ["id"]
    }
                  ]
                },"saved_promotions": {
                  Row: {
                    "created_at": string,"promotion_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"promotion_id": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"promotion_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "saved_promotions_promotion_id_fkey"
      columns: ["promotion_id"]
isOneToOne: false
      referencedRelation: "promotion_stats"
      referencedColumns: ["promotion_id"]
    },{
      foreignKeyName: "saved_promotions_promotion_id_fkey"
      columns: ["promotion_id"]
isOneToOne: false
      referencedRelation: "promotions"
      referencedColumns: ["id"]
    }
                  ]
                },"store_prices": {
                  Row: {
                    "price": number,"product_id": string,"store_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "price": number,"product_id": string,"store_id": string,"updated_at"?: string
                  }
                  Update: {
                    "price"?: number,"product_id"?: string,"store_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "store_prices_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "store_prices_store_id_fkey"
      columns: ["store_id"]
isOneToOne: false
      referencedRelation: "stores"
      referencedColumns: ["id"]
    }
                  ]
                },"stores": {
                  Row: {
                    "address": string,"chain_id": string,"created_at": string,"id": string,"lat": number,"lng": number,"name": string,"neighborhood": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "address": string,"chain_id": string,"created_at"?: string,"id"?: string,"lat": number,"lng": number,"name": string,"neighborhood"?: string | null
                  }
                  Update: {
                    "address"?: string,"chain_id"?: string,"created_at"?: string,"id"?: string,"lat"?: number,"lng"?: number,"name"?: string,"neighborhood"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "stores_chain_id_fkey"
      columns: ["chain_id"]
isOneToOne: false
      referencedRelation: "chains"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "promotion_stats": {
                  Row: {
                    "chain_id": string,"clicks": number | null,"codes": number | null,"new_customers": number | null,"promotion_id": string,"redemptions": number | null,"saves": number | null,"views": number | null
                  }
                  ComputedFields: never
                  Insert: {
                           "chain_id"?: string | null,"clicks"?: never,"codes"?: never,"new_customers"?: never,"promotion_id"?: string | null,"redemptions"?: never,"saves"?: never,"views"?: never
                         }
                        Update: {
                           "chain_id"?: string | null,"clicks"?: never,"codes"?: never,"new_customers"?: never,"promotion_id"?: string | null,"redemptions"?: never,"saves"?: never,"views"?: never
                         }
                        Relationships: [
                    {
      foreignKeyName: "promotions_chain_id_fkey"
      columns: ["chain_id"]
isOneToOne: false
      referencedRelation: "chains"
      referencedColumns: ["id"]
    }
                  ]
                },"redemption_facts": {
                  Row: {
                    "chain_id": string,"id": string,"is_new_customer": boolean | null,"promotion_id": string,"redeemed_at": string | null,"redeemed_store_id": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                           "chain_id"?: string | null,"id"?: string | null,"is_new_customer"?: never,"promotion_id"?: string | null,"redeemed_at"?: string | null,"redeemed_store_id"?: string | null,"user_id"?: string | null
                         }
                        Update: {
                           "chain_id"?: string | null,"id"?: string | null,"is_new_customer"?: never,"promotion_id"?: string | null,"redeemed_at"?: string | null,"redeemed_store_id"?: string | null,"user_id"?: string | null
                         }
                        Relationships: [
                    {
      foreignKeyName: "redemption_codes_chain_id_fkey"
      columns: ["chain_id"]
isOneToOne: false
      referencedRelation: "chains"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "redemption_codes_promotion_id_fkey"
      columns: ["promotion_id"]
isOneToOne: false
      referencedRelation: "promotion_stats"
      referencedColumns: ["promotion_id"]
    },{
      foreignKeyName: "redemption_codes_promotion_id_fkey"
      columns: ["promotion_id"]
isOneToOne: false
      referencedRelation: "promotions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "redemption_codes_redeemed_store_id_fkey"
      columns: ["redeemed_store_id"]
isOneToOne: false
      referencedRelation: "stores"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "auth_chain_id":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"auth_role":
{ Args: Record<PropertyKey, never>; Returns: Database["public"]['Enums']["user_role"]
                           },
"chain_daily_stats":
{ Args: { "p_chain_id": string,"p_days"?: number }; Returns: {
              "codes": number,"day": string,"new_customers": number,"redemptions": number,"views": number
            }[]
                           },
"check_rate_limit":
{ Args: { "p_key": string,"p_limit": number,"p_window_seconds": number }; Returns: boolean
                           },
"distance_km":
{ Args: { "lat1": number,"lat2": number,"lng1": number,"lng2": number }; Returns: number
                           },
"generate_code":
{ Args: { "p_promotion_id": string }; Returns: {
              "chain_id": string,
"code": string,
"created_at": string,
"expires_at": string,
"id": string,
"promotion_id": string,
"redeemed_at": string | null,
"redeemed_by": string | null,
"redeemed_store_id": string | null,
"status": Database["public"]['Enums']["code_status"],
"user_id": string
            }
                          SetofOptions: {
        from: "*"
        to: "redemption_codes"
        isOneToOne: true
        isSetofReturn: false
      } },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"nearby_promotions":
{ Args: { "p_lat": number,"p_lng": number,"p_radius_km"?: number }; Returns: {
              "category_emoji": string,"category_id": string,"category_name": string,"category_slug": string,"chain_color": string,"chain_id": string,"chain_name": string,"conditions": string,"description": string,"distance_km": number,"ends_at": string,"id": string,"product_id": string,"product_name": string,"starts_at": string,"store_count": number,"store_id": string,"store_lat": number,"store_lng": number,"store_name": string,"store_neighborhood": string,"title": string,"type": Database["public"]['Enums']["promo_type"],"value": number
            }[]
                           },
"normalize_code":
{ Args: { "p_code": string }; Returns: string
                           },
"promotion_is_live":
{ Args: { "p": Omit<Database["public"]['Tables']["promotions"]['Row'], Database["public"]['Tables']["promotions"]['ComputedFields']> }; Returns: boolean
                           },
"random_code":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"redeem_code":
{ Args: { "p_code": string,"p_store_id": string }; Returns: Json
                           },
"search_product_prices":
{ Args: { "p_lat": number,"p_lng": number,"p_query": string,"p_radius_km"?: number }; Returns: {
              "brand": string,"chain_color": string,"chain_id": string,"chain_name": string,"distance_km": number,"price": number,"product_id": string,"product_name": string,"promotion_ends_at": string,"promotion_id": string,"promotion_title": string,"promotion_type": Database["public"]['Enums']["promo_type"],"promotion_value": number,"store_id": string,"store_name": string,"store_neighborhood": string,"unit": string,"updated_at": string
            }[]
                           },
"search_text":
{ Args: { "t": string }; Returns: string
                           },
"track_event":
{ Args: { "p_promotion_id": string,"p_type": Database["public"]['Enums']["event_type"] }; Returns: undefined
                           }
          }
          Enums: {
            "code_status": "active"|"redeemed"|"expired","event_type": "view"|"save"|"click","promo_status": "borrador"|"activa"|"pausada","promo_type": "porcentaje"|"2x1"|"3x2"|"segunda_unidad"|"precio_fijo","user_role": "consumer"|"merchant"|"admin"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "code_status": ["active", "redeemed", "expired"],"event_type": ["view", "save", "click"],"promo_status": ["borrador", "activa", "pausada"],"promo_type": ["porcentaje", "2x1", "3x2", "segunda_unidad", "precio_fijo"],"user_role": ["consumer", "merchant", "admin"]
          }
        }
} as const
