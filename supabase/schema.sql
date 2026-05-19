-- Supabase 数据库表结构
-- 创建时间: 2024

-- 1. 用户表 (profiles)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    nickname TEXT,
    avatar_url TEXT DEFAULT 'https://api.dicebear.com/7.x/avataaars/svg?seed=vocoseed',
    member_type TEXT DEFAULT 'free' CHECK (member_type IN ('free', 'pro', 'team')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创意想法表 (ideas)
CREATE TABLE IF NOT EXISTS ideas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    transcript TEXT,
    status TEXT DEFAULT 'recording' CHECK (status IN ('recording', 'chatting', 'searching', 'generating', 'completed')),
    progress INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    keywords TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 消息表 (messages)
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'ai', 'system')),
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image')),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 搜索结果表 (search_results)
CREATE TABLE IF NOT EXISTS search_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE NOT NULL,
    result_type TEXT NOT NULL CHECK (result_type IN ('patent', 'paper', 'product', 'report')),
    title TEXT NOT NULL,
    source TEXT,
    summary TEXT,
    url TEXT,
    cited INTEGER,
    year INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 用户使用统计表 (usage_stats)
CREATE TABLE IF NOT EXISTS usage_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    recordings_this_month INTEGER DEFAULT 0,
    recordings_limit INTEGER DEFAULT 10,
    searches_today INTEGER DEFAULT 0,
    searches_limit INTEGER DEFAULT 5,
    total_ideas INTEGER DEFAULT 0,
    total_conversations INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 1,
    last_active_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_ideas_user_id ON ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_idea_id ON messages(idea_id);
CREATE INDEX IF NOT EXISTS idx_search_results_idea_id ON search_results(idea_id);
CREATE INDEX IF NOT EXISTS idx_usage_stats_user_id ON usage_stats(user_id);

-- 创建更新时间的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要更新时间的表添加触发器
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ideas_updated_at
    BEFORE UPDATE ON ideas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_stats_updated_at
    BEFORE UPDATE ON usage_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建用户注册时自动创建 profile 和 usage_stats 的触发器
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- 从 raw_user_meta_data 获取 nickname，如果没有则使用 email 的用户名部分
    INSERT INTO public.profiles (id, email, nickname)
    VALUES (
        NEW.id, 
        COALESCE(NEW.email, ''), 
        COALESCE(NEW.raw_user_meta_data->>'nickname', SPLIT_PART(COALESCE(NEW.email, ''), '@', 1), '创意用户')
    );
    
    INSERT INTO public.usage_stats (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 设置 Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_stats ENABLE ROW LEVEL SECURITY;

-- Profiles 表的 RLS 策略
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Ideas 表的 RLS 策略
CREATE POLICY "Users can view own ideas"
    ON ideas FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ideas"
    ON ideas FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ideas"
    ON ideas FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ideas"
    ON ideas FOR DELETE
    USING (auth.uid() = user_id);

-- Messages 表的 RLS 策略
CREATE POLICY "Users can view messages for own ideas"
    ON messages FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM ideas
        WHERE ideas.id = messages.idea_id AND ideas.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert messages for own ideas"
    ON messages FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM ideas
        WHERE ideas.id = idea_id AND ideas.user_id = auth.uid()
    ));

-- Search Results 表的 RLS 策略
CREATE POLICY "Users can view search results for own ideas"
    ON search_results FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM ideas
        WHERE ideas.id = search_results.idea_id AND ideas.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert search results for own ideas"
    ON search_results FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM ideas
        WHERE ideas.id = idea_id AND ideas.user_id = auth.uid()
    ));

-- Usage Stats 表的 RLS 策略
CREATE POLICY "Users can view own usage stats"
    ON usage_stats FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own usage stats"
    ON usage_stats FOR UPDATE
    USING (auth.uid() = user_id);
