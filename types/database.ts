// ==============================================================================
// TYPE DEFINITIONS TƯƠNG THÍCH HOÀN TOÀN VỚI SUPABASE POSTGRESQL SCHEMA (DAILYE)
// ==============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AccessLevel = 'free' | 'premium' | 'admin';
export type TOEICPart = 'part1' | 'part2' | 'part3' | 'part4' | 'part5' | 'part6' | 'part7';
export type SkillType = 'vocabulary' | 'grammar' | 'listening' | 'reading' | 'strategy';
export type ContentStatus = 'draft' | 'published';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type TestType = 'mini' | 'part' | 'full';
export type OptionKey = 'A' | 'B' | 'C' | 'D';
export type ItemTypeSRS = 'question' | 'vocab';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          target_score: number;
          access_level: AccessLevel;
          current_level: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          target_score?: number;
          access_level?: AccessLevel;
          current_level?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          target_score?: number;
          access_level?: AccessLevel;
          current_level?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      lessons: {
        Row: {
          id: string;
          title: string;
          slug: string;
          content: string;
          skill: SkillType;
          level_tag: string | null;
          status: ContentStatus;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          content: string;
          skill: SkillType;
          level_tag?: string | null;
          status?: ContentStatus;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          content?: string;
          skill?: SkillType;
          level_tag?: string | null;
          status?: ContentStatus;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      questions: {
        Row: {
          id: string;
          code: string;
          exam_part: TOEICPart;
          question_type: string | null;
          level_tag: string | null;
          question_text: string;
          options: { A: string; B: string; C: string; D: string };
          correct_answer: OptionKey;
          explanation: string | null;
          knowledge_tag: string[];
          topic: string | null;
          difficulty: DifficultyLevel;
          image_url: string | null;
          audio_url: string | null;
          transcript: string | null;
          media_source: string | null;
          source_id: string | null;
          status: ContentStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          exam_part: TOEICPart;
          question_type?: string | null;
          level_tag?: string | null;
          question_text: string;
          options: { A: string; B: string; C: string; D: string };
          correct_answer: OptionKey;
          explanation?: string | null;
          knowledge_tag?: string[];
          topic?: string | null;
          difficulty?: DifficultyLevel;
          image_url?: string | null;
          audio_url?: string | null;
          transcript?: string | null;
          media_source?: string | null;
          source_id?: string | null;
          status?: ContentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          exam_part?: TOEICPart;
          question_type?: string | null;
          level_tag?: string | null;
          question_text?: string;
          options?: { A: string; B: string; C: string; D: string };
          correct_answer?: OptionKey;
          explanation?: string | null;
          knowledge_tag?: string[];
          topic?: string | null;
          difficulty?: DifficultyLevel;
          image_url?: string | null;
          audio_url?: string | null;
          transcript?: string | null;
          media_source?: string | null;
          source_id?: string | null;
          status?: ContentStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      lesson_questions: {
        Row: {
          lesson_id: string;
          question_id: string;
          order_index: number;
        };
        Insert: {
          lesson_id: string;
          question_id: string;
          order_index?: number;
        };
        Update: {
          lesson_id?: string;
          question_id?: string;
          order_index?: number;
        };
      };
      tests: {
        Row: {
          id: string;
          title: string;
          test_type: TestType;
          time_limit_minutes: number;
          status: ContentStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          test_type: TestType;
          time_limit_minutes?: number;
          status?: ContentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          test_type?: TestType;
          time_limit_minutes?: number;
          status?: ContentStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      test_questions: {
        Row: {
          test_id: string;
          question_id: string;
          order_index: number;
        };
        Insert: {
          test_id: string;
          question_id: string;
          order_index?: number;
        };
        Update: {
          test_id?: string;
          question_id?: string;
          order_index?: number;
        };
      };
      test_attempts: {
        Row: {
          id: string;
          user_id: string;
          test_id: string | null;
          started_at: string;
          finished_at: string | null;
          score: number;
          total_questions: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          test_id?: string | null;
          started_at?: string;
          finished_at?: string | null;
          score?: number;
          total_questions?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          test_id?: string | null;
          started_at?: string;
          finished_at?: string | null;
          score?: number;
          total_questions?: number;
          created_at?: string;
        };
      };
      user_answers: {
        Row: {
          id: string;
          attempt_id: string;
          question_id: string;
          user_id: string;
          selected_answer: OptionKey;
          is_correct: boolean;
          time_spent_seconds: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          attempt_id: string;
          question_id: string;
          user_id: string;
          selected_answer: OptionKey;
          is_correct: boolean;
          time_spent_seconds?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          attempt_id?: string;
          question_id?: string;
          user_id?: string;
          selected_answer?: OptionKey;
          is_correct?: boolean;
          time_spent_seconds?: number;
          created_at?: string;
        };
      };
      error_logs: {
        Row: {
          id: string;
          user_id: string;
          question_id: string;
          knowledge_tag: string | null;
          wrong_count: number;
          last_wrong_at: string;
          resolved: boolean;
          resolved_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          question_id: string;
          knowledge_tag?: string | null;
          wrong_count?: number;
          last_wrong_at?: string;
          resolved?: boolean;
          resolved_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          question_id?: string;
          knowledge_tag?: string | null;
          wrong_count?: number;
          last_wrong_at?: string;
          resolved?: boolean;
          resolved_at?: string | null;
          created_at?: string;
        };
      };
      review_schedule: {
        Row: {
          id: string;
          user_id: string;
          item_type: ItemTypeSRS;
          item_id: string;
          due_date: string;
          interval_days: number;
          ease_factor: number;
          review_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          item_type: ItemTypeSRS;
          item_id: string;
          due_date: string;
          interval_days?: number;
          ease_factor?: number;
          review_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          item_type?: ItemTypeSRS;
          item_id?: string;
          due_date?: string;
          interval_days?: number;
          ease_factor?: number;
          review_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      vocabulary_items: {
        Row: {
          id: string;
          word: string;
          meaning_vi: string;
          example: string | null;
          topic: string | null;
          level_tag: string | null;
          audio_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          word: string;
          meaning_vi: string;
          example?: string | null;
          topic?: string | null;
          level_tag?: string | null;
          audio_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          word?: string;
          meaning_vi?: string;
          example?: string | null;
          topic?: string | null;
          level_tag?: string | null;
          audio_url?: string | null;
          created_at?: string;
        };
      };
      content_imports: {
        Row: {
          id: string;
          admin_id: string | null;
          filename: string;
          total_rows: number;
          success_rows: number;
          error_rows: number;
          error_detail: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id?: string | null;
          filename: string;
          total_rows?: number;
          success_rows?: number;
          error_rows?: number;
          error_detail?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          admin_id?: string | null;
          filename?: string;
          total_rows?: number;
          success_rows?: number;
          error_rows?: number;
          error_detail?: Json;
          created_at?: string;
        };
      };
    };
    Views: {
      published_questions_safe: {
        Row: {
          id: string;
          code: string;
          exam_part: TOEICPart;
          question_type: string | null;
          level_tag: string | null;
          question_text: string;
          options: { A: string; B: string; C: string; D: string };
          knowledge_tag: string[];
          topic: string | null;
          difficulty: DifficultyLevel;
          image_url: string | null;
          audio_url: string | null;
          transcript: string | null;
          media_source: string | null;
          source_id: string | null;
          status: ContentStatus;
          created_at: string;
        };
      };
    };
  };
}
