import React, { useState, useEffect, useMemo } from 'react';
import { 
  auth, db 
} from './firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User
} from 'firebase/auth';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  doc, 
  setDoc, 
  getDoc,
  limit,
  where,
  getDocs
} from 'firebase/firestore';
import { 
  MessageSquare, 
  Plus, 
  Users, 
  TrendingUp, 
  Zap, 
  LogOut, 
  LogIn,
  ChevronRight,
  Search,
  Briefcase,
  Lightbulb,
  AlertCircle,
  LayoutDashboard,
  MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, Topic, Project, TopicType } from './types';

// --- Components ---

const Navbar = ({ user, onLogin, onLogout }: { user: User | null, onLogin: () => void, onLogout: () => void }) => (
  <nav className="border-b border-black/5 bg-white/80 backdrop-blur-md sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between h-16 items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <Zap className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight">AI-Traditional Hub</span>
        </div>
        
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full border border-black/10" referrerPolicy="no-referrer" />
                <span className="text-sm font-medium hidden sm:block">{user.displayName}</span>
              </div>
              <button 
                onClick={onLogout}
                className="p-2 hover:bg-black/5 rounded-full transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button 
              onClick={onLogin}
              className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-zinc-800 transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>Login with Google</span>
            </button>
          )}
        </div>
      </div>
    </div>
  </nav>
);

const Sidebar = ({ activeTab, setActiveTab, seedInitialData }: { activeTab: string, setActiveTab: (tab: string) => void, seedInitialData: () => Promise<void> }) => {
  const tabs = [
    { id: 'community', label: '社区论坛', icon: MessageSquare },
    { id: 'projects', label: '立项协作', icon: LayoutDashboard },
    { id: 'hot', label: '十大热点', icon: TrendingUp },
  ];

  return (
    <div className="w-64 hidden md:block border-r border-black/5 h-[calc(100vh-64px)] p-4 sticky top-16">
      <div className="space-y-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id 
                ? 'bg-black text-white shadow-md' 
                : 'text-zinc-500 hover:bg-black/5'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
        <div className="pt-8 mt-8 border-t border-black/5">
          <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">开发者工具</p>
          <button
            onClick={() => {
              if (window.confirm("确定要导入基础帖子数据吗？")) {
                seedInitialData();
              }
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-emerald-600 hover:bg-emerald-50 transition-all"
          >
            <Zap className="w-5 h-5" />
            导入基础数据
          </button>
        </div>
      </div>
    </div>
  );
};

const TopicCard = ({ topic, onClick }: { topic: Topic, onClick: () => void, key?: React.Key }) => (
  <motion.div 
    layout
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    onClick={onClick}
    className="bg-white border border-black/5 p-6 rounded-2xl hover:shadow-lg transition-all cursor-pointer group"
  >
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center gap-2">
        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
          topic.type === 'pain_point' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'
        }`}>
          {topic.type === 'pain_point' ? '行业痛点' : 'AI 前沿'}
        </span>
        {topic.industry && (
          <span className="text-xs text-zinc-400 font-medium"># {topic.industry}</span>
        )}
      </div>
      <span className="text-xs text-zinc-400">{topic.createdAt?.seconds ? new Date(topic.createdAt.seconds * 1000).toLocaleDateString() : '刚刚'}</span>
    </div>
    
    <h3 className="text-lg font-bold mb-2 group-hover:text-zinc-600 transition-colors">{topic.title}</h3>
    <p className="text-zinc-500 text-sm line-clamp-2 mb-4">{topic.content}</p>
    
    <div className="flex items-center justify-between pt-4 border-t border-black/5">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-zinc-100 rounded-full flex items-center justify-center text-[10px] font-bold">
          {topic.authorName?.[0]}
        </div>
        <span className="text-xs font-medium text-zinc-600">{topic.authorName}</span>
      </div>
      <div className="flex items-center gap-3 text-zinc-400">
        <div className="flex items-center gap-1">
          <MessageCircle className="w-4 h-4" />
          <span className="text-xs">{topic.commentCount || 0}</span>
        </div>
      </div>
    </div>
  </motion.div>
);

const ProjectCard = ({ project }: { project: Project, key?: React.Key }) => (
  <div className="bg-white border border-black/5 p-6 rounded-2xl shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <h3 className="font-bold text-lg">{project.name}</h3>
      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
        project.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-zinc-100 text-zinc-700'
      }`}>
        {project.status}
      </span>
    </div>
    <p className="text-zinc-500 text-sm mb-4">{project.description}</p>
    <div className="flex items-center gap-2">
      <Users className="w-4 h-4 text-zinc-400" />
      <span className="text-xs text-zinc-500">{project.members.length} 位成员</span>
    </div>
    <button className="w-full mt-4 py-2 bg-black text-white rounded-xl text-sm font-medium hover:bg-zinc-800 transition-all">
      进入工作台
    </button>
  </div>
);

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState('community');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isNewTopicModalOpen, setIsNewTopicModalOpen] = useState(false);
  const [newTopic, setNewTopic] = useState({ title: '', content: '', type: 'pain_point' as TopicType, industry: '' });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const userDoc = await getDoc(doc(db, 'users', u.uid));
        if (userDoc.exists()) {
          setProfile(userDoc.data() as UserProfile);
        } else {
          // Create default profile
          const newProfile: UserProfile = {
            uid: u.uid,
            displayName: u.displayName || 'Anonymous',
            email: u.email || '',
            photoURL: u.photoURL || '',
            role: 'industry_expert', // Default
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, 'users', u.uid), newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'topics'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Topic));
      setTopics(docs);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'projects'), where('members', 'array-contains', user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Project));
        setProjects(docs);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = () => signOut(auth);

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTopic.title || !newTopic.content) return;

    try {
      await addDoc(collection(db, 'topics'), {
        ...newTopic,
        authorUid: user.uid,
        authorName: user.displayName,
        viewCount: 0,
        commentCount: 0,
        tags: [],
        createdAt: serverTimestamp()
      });
      setIsNewTopicModalOpen(false);
      setNewTopic({ title: '', content: '', type: 'pain_point', industry: '' });
    } catch (error) {
      console.error("Failed to create topic", error);
    }
  };

  const seedInitialData = async () => {
    if (!user) return;
    const initialTopics = [
      {
        title: "用多视角三维重建实现乒乓球鹰眼",
        type: "ai_insight" as TopicType,
        industry: "体育科技",
        content: "传统的乒乓球判罚依赖人工，但在高速运动下极易出错。我们提出利用多台高速摄像机进行三维重建，实时追踪球的轨迹与落点，精度可达毫米级。这不仅能辅助判罚，还能为运动员提供数据分析。",
        commentCount: 12
      },
      {
        title: "足球视频端到端神经网络实现自动裁剪",
        type: "ai_insight" as TopicType,
        industry: "媒体转播",
        content: "针对足球比赛长达90分钟的录像，人工剪辑集锦费时费力。通过端到端神经网络，系统可以自动识别进球、红黄牌、精彩过人等关键事件，并自动裁剪出精彩片段，极大提升转播效率。",
        commentCount: 8
      },
      {
        title: "透明化的搜索广告推荐系统",
        type: "pain_point" as TopicType,
        industry: "互联网广告",
        content: "当前广告推荐系统往往是“黑盒”，用户和广告主都不知道为什么会被推荐。我们希望探讨一种透明化的推荐机制，让广告主了解流量去向，让用户了解推荐逻辑，从而建立更高的行业信任度。",
        commentCount: 15
      }
    ];

    try {
      for (const t of initialTopics) {
        await addDoc(collection(db, 'topics'), {
          ...t,
          authorUid: user.uid,
          authorName: user.displayName,
          viewCount: Math.floor(Math.random() * 100),
          tags: [t.industry],
          createdAt: serverTimestamp()
        });
      }
      alert("基础数据已成功导入！");
    } catch (error) {
      console.error("Seeding failed", error);
      alert("导入失败，请检查权限。");
    }
  };

  const hotTopics = useMemo(() => {
    return [...topics].sort((a, b) => (b.commentCount || 0) - (a.commentCount || 0)).slice(0, 10);
  }, [topics]);

  return (
    <div className="min-h-screen bg-[#F9F9F9] text-zinc-900 font-sans">
      <Navbar user={user} onLogin={handleLogin} onLogout={handleLogout} />
      
      <div className="max-w-7xl mx-auto flex">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} seedInitialData={seedInitialData} />
        
        <main className="flex-1 p-4 md:p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'community' && (
              <motion.div 
                key="community"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">社区论坛</h1>
                    <p className="text-zinc-500 mt-1">交流行业痛点，探索 AI 赋能方案</p>
                  </div>
                  {user && (
                    <button 
                      onClick={() => setIsNewTopicModalOpen(true)}
                      className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full font-medium hover:shadow-lg transition-all"
                    >
                      <Plus className="w-5 h-5" />
                      <span>发布新话题</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {topics.map(topic => (
                    <TopicCard key={topic.id} topic={topic} onClick={() => {}} />
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'projects' && (
              <motion.div 
                key="projects"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">立项协作</h1>
                    <p className="text-zinc-500 mt-1">将火花转化为现实，管理你的 AI 赋能项目</p>
                  </div>
                  <button className="flex items-center gap-2 border border-black/10 bg-white px-6 py-3 rounded-full font-medium hover:bg-zinc-50 transition-all">
                    <Plus className="w-5 h-5" />
                    <span>发起新项目</span>
                  </button>
                </div>

                {!user ? (
                  <div className="bg-white border border-black/5 p-12 rounded-3xl text-center">
                    <AlertCircle className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">请先登录</h3>
                    <p className="text-zinc-500 mb-6">登录后即可查看和管理你的协作项目</p>
                    <button onClick={handleLogin} className="bg-black text-white px-8 py-3 rounded-full font-medium">立即登录</button>
                  </div>
                ) : projects.length === 0 ? (
                  <div className="bg-white border border-black/5 p-12 rounded-3xl text-center">
                    <Briefcase className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">暂无活跃项目</h3>
                    <p className="text-zinc-500">在社区中寻找合作伙伴，开启你的第一个 AI 项目</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map(project => (
                      <ProjectCard key={project.id} project={project} />
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'hot' && (
              <motion.div 
                key="hot"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">十大热点</h1>
                  <p className="text-zinc-500 mt-1">当前最受关注的行业痛点与 AI 思考</p>
                </div>

                <div className="space-y-4">
                  {hotTopics.map((topic, index) => (
                    <div key={topic.id} className="flex items-center gap-6 bg-white p-6 rounded-2xl border border-black/5 hover:border-black/20 transition-all group">
                      <span className="text-4xl font-black text-zinc-100 group-hover:text-zinc-200 transition-colors italic">
                        {(index + 1).toString().padStart(2, '0')}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${
                            topic.type === 'pain_point' ? 'text-orange-500' : 'text-emerald-500'
                          }`}>
                            {topic.type === 'pain_point' ? 'Pain Point' : 'AI Insight'}
                          </span>
                        </div>
                        <h3 className="font-bold text-lg">{topic.title}</h3>
                        <div className="flex items-center gap-4 mt-2 text-xs text-zinc-400">
                          <span>{topic.commentCount} 条讨论</span>
                          <span>•</span>
                          <span>{topic.industry || '通用领域'}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-black transition-all" />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* New Topic Modal */}
      <AnimatePresence>
        {isNewTopicModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewTopicModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-8 overflow-hidden"
            >
              <h2 className="text-2xl font-bold mb-6">发布新话题</h2>
              <form onSubmit={handleCreateTopic} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">话题类型</label>
                    <select 
                      value={newTopic.type}
                      onChange={e => setNewTopic({...newTopic, type: e.target.value as TopicType})}
                      className="w-full bg-zinc-50 border border-black/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 ring-black/5"
                    >
                      <option value="pain_point">行业痛点 (Industry Pain Point)</option>
                      <option value="ai_insight">AI 前沿 (AI Insight)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">所属行业</label>
                    <input 
                      type="text"
                      placeholder="例如：制造业、医疗、金融"
                      value={newTopic.industry}
                      onChange={e => setNewTopic({...newTopic, industry: e.target.value})}
                      className="w-full bg-zinc-50 border border-black/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 ring-black/5"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">标题</label>
                  <input 
                    type="text"
                    required
                    placeholder="简明扼要地描述你的痛点或见解"
                    value={newTopic.title}
                    onChange={e => setNewTopic({...newTopic, title: e.target.value})}
                    className="w-full bg-zinc-50 border border-black/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 ring-black/5"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">详细内容</label>
                  <textarea 
                    required
                    rows={6}
                    placeholder="在这里分享更多细节..."
                    value={newTopic.content}
                    onChange={e => setNewTopic({...newTopic, content: e.target.value})}
                    className="w-full bg-zinc-50 border border-black/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 ring-black/5 resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsNewTopicModalOpen(false)}
                    className="flex-1 py-3 border border-black/10 rounded-xl font-medium hover:bg-zinc-50 transition-all"
                  >
                    取消
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-black text-white rounded-xl font-medium hover:bg-zinc-800 transition-all"
                  >
                    立即发布
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
