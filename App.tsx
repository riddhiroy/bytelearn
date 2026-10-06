import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Animated, Dimensions, FlatList, PanResponder, Pressable, SafeAreaView, Share, StatusBar, StyleSheet, Text, TextInput, View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {hasSupabaseConfig, supabase} from './lib/supabase';
import {Ionicons} from '@expo/vector-icons';

const {height: H, width: W} = Dimensions.get('window');
const C={bg:'#07070A',card:'#111218',text:'#F7F7FA',muted:'#A6A8B3',accent:'#7C5CFF',cyan:'#41E6D5',pink:'#FF4F9A',green:'#49D17D',yellow:'#FFD166'};

type Scene={kind:'title'|'text'|'flow'|'code'|'quiz'|'summary';title?:string;body?:string;items?:string[];code?:string;question?:string;options?:string[];answer?:number};
type Lesson={id:string;category:string;title:string;subtitle:string;tag:string;scenes:Scene[]};

const lessons:Lesson[]=[
{id:'llm',category:'AI',title:'What is an LLM?',subtitle:'The engine behind modern AI',tag:'AI BASICS',scenes:[
{kind:'title',title:'WHAT IS AN LLM?',body:'A machine that learns patterns in language.'},{kind:'flow',title:'Think of it like this',items:['Lots of text','↓','Patterns','↓','Predictions','↓','Useful answers']},{kind:'text',title:'Large Language Model',body:'During training, an LLM learns statistical patterns in huge amounts of text. It generates responses by predicting tokens repeatedly.'},{kind:'summary',title:'TL;DR',body:'An LLM is a pattern-learning system that generates language one token at a time.'},{kind:'quiz',question:'What does an LLM primarily learn?',options:['How to store files','Patterns in language','How to build phones'],answer:1}]},
{id:'rag',category:'AI',title:'What is RAG?',subtitle:'Give an AI system useful external context',tag:'AI',scenes:[
{kind:'title',title:'RAG',body:'Retrieval-Augmented Generation'},{kind:'flow',title:'Without RAG',items:['Question','↓','Model knowledge','↓','Answer']},{kind:'flow',title:'With RAG',items:['Question','↓','Search documents','↓','Relevant context','↓','AI answer']},{kind:'text',title:'Why it matters',body:'RAG lets an AI system retrieve current or private information before generating an answer.'},{kind:'quiz',question:'What does the R in RAG stand for?',options:['Reasoning','Retrieval','Rendering'],answer:1}]},
{id:'agent',category:'AI',title:'What is an AI Agent?',subtitle:'A chatbot talks. An agent can take action.',tag:'AI AGENTS',scenes:[
{kind:'title',title:'AI AGENTS',body:'AI that can reason, use tools and act.'},{kind:'flow',title:'The loop',items:['Goal','↓','Plan','↓','Use a tool','↓','Observe','↓','Act']},{kind:'text',title:'Example',body:'“Find the cheapest flight.” An agent could search flights, compare options and return the best match.'},{kind:'summary',title:'TL;DR',body:'An AI agent combines a model with tools and an action loop.'},{kind:'quiz',question:'Which is closest to an AI agent?',options:['A static FAQ','An AI system that can use tools','A database'],answer:1}]},
{id:'tokens',category:'AI',title:'What are AI Tokens?',subtitle:'The units an LLM processes',tag:'AI BASICS',scenes:[
{kind:'title',title:'TOKENS',body:'AI models usually process text as tokens, not whole sentences.'},{kind:'flow',title:'Text becomes pieces',items:['“Hello world!”','↓','“Hello” + “ world” + “!”','↓','Token IDs']},{kind:'code',title:'Conceptually',code:'Text → tokenizer → token IDs\n\n[15496, 995, 0]'},{kind:'text',title:'Why care?',body:'Token counts affect context limits, latency and the cost of many AI APIs.'},{kind:'quiz',question:'Why do token counts matter?',options:['They affect AI context and cost','They change your screen size','They are passwords'],answer:0}]},
{id:'api',category:'Programming',title:'What is an API?',subtitle:'How software talks to other software',tag:'PROGRAMMING',scenes:[
{kind:'title',title:'WHAT IS AN API?',body:'A defined way for software to request something from another system.'},{kind:'flow',title:'Restaurant analogy',items:['You → Waiter → Kitchen','Request → API → Service','Result ← API ← Service']},{kind:'code',title:'A simple request',code:'GET /users/42\n\n→ 200 OK\n{ "name": "Maya" }'},{kind:'text',title:'Why APIs matter',body:'Teams can build systems independently while agreeing on request and response formats.'},{kind:'quiz',question:'What does an API primarily provide?',options:['A UI design','A communication contract','A hard drive'],answer:1}]},
{id:'docker',category:'Cloud',title:'What is Docker?',subtitle:'Package an app with what it needs to run',tag:'CLOUD',scenes:[
{kind:'title',title:'DOCKER',body:'“It works on my machine” — solved.'},{kind:'flow',title:'The idea',items:['App + dependencies','↓','Container','↓','Run consistently']},{kind:'text',title:'The payoff',body:'A container packages an application and its dependencies into a portable unit.'},{kind:'summary',title:'TL;DR',body:'Docker makes software environments more reproducible and portable.'},{kind:'quiz',question:'What does a container package?',options:['Only the UI','An app and its dependencies','Only a database'],answer:1}]},
{id:'cache',category:'System Design',title:'What is Caching?',subtitle:'How apps become much faster',tag:'SYSTEM DESIGN',scenes:[
{kind:'title',title:'CACHING',body:'Don’t repeatedly fetch what you already know.'},{kind:'flow',title:'No cache',items:['User','↓','Server','↓','Database','↓','Response']},{kind:'flow',title:'With cache',items:['User','↓','Cache','⚡','Response','↓','DB when needed']},{kind:'text',title:'The trade-off',body:'Caches improve speed and reduce database load, but cached data can become stale.'},{kind:'quiz',question:'What is a common benefit of caching?',options:['More database work','Lower latency','More network hops'],answer:1}]},
{id:'sql',category:'Programming',title:'SQL vs NoSQL',subtitle:'Different ways to model data',tag:'DATA',scenes:[
{kind:'title',title:'SQL vs NoSQL',body:'Structured tables vs more flexible data models.'},{kind:'flow',title:'SQL',items:['Tables','↓','Rows + columns','↓','Relationships']},{kind:'flow',title:'NoSQL',items:['Documents / key-value','↓','Flexible structure','↓','Scale patterns']},{kind:'text',title:'Neither is better',body:'The right choice depends on access patterns, consistency needs and scale.'},{kind:'quiz',question:'Which is a relational database language?',options:['SQL','HTML','CSS'],answer:0}]},
{id:'queue',category:'System Design',title:'What is a Message Queue?',subtitle:'Handle work asynchronously',tag:'SYSTEM DESIGN',scenes:[
{kind:'title',title:'MESSAGE QUEUES',body:'Let one system hand work to another without waiting.'},{kind:'flow',title:'The idea',items:['Producer','↓','Queue','↓','Consumer']},{kind:'text',title:'Why use one?',body:'Queues absorb traffic spikes and let consumers process work independently.'},{kind:'summary',title:'TL;DR',body:'A queue decouples producers from consumers and smooths bursts of work.'},{kind:'quiz',question:'What is a queue useful for?',options:['Buffering work','Rendering CSS','Replacing every database'],answer:0}]},
{id:'cdn',category:'Cloud',title:'What is a CDN?',subtitle:'Move content closer to your users',tag:'CLOUD',scenes:[
{kind:'title',title:'CDN',body:'Content Delivery Network'},{kind:'flow',title:'Without a CDN',items:['User in India','↓','Origin in US','↓','Longer trip']},{kind:'flow',title:'With a CDN',items:['User','↓','Nearby edge','⚡','Cached content']},{kind:'text',title:'The payoff',body:'A CDN can reduce latency by serving static content from locations closer to users.'},{kind:'quiz',question:'What is a CDN mainly trying to reduce?',options:['Latency','Screen brightness','Code indentation'],answer:0}]}
];

const categories=['AI','Programming','Cloud','System Design'];

function Logo(){return <Text style={styles.logo}>BYTE<Text style={{color:C.accent}}>LEARN</Text></Text>}

function Scene({scene,active}:{scene:Scene;active:boolean}){
 const a=useRef(new Animated.Value(0)).current;
 useEffect(()=>{a.setValue(0);if(active)Animated.spring(a,{toValue:1,useNativeDriver:true,friction:8}).start()},[active,scene]);
 const y=a.interpolate({inputRange:[0,1],outputRange:[28,0]});
 return <Animated.View style={{opacity:a,transform:[{translateY:y}],flex:1,justifyContent:'center'}}>
  {scene.kind==='title'&&<><Text style={styles.eyebrow}>BYTELEARN · 60 SEC</Text><Text style={styles.big}>{scene.title}</Text><Text style={styles.body}>{scene.body}</Text></>}
  {scene.kind==='text'&&<><Text style={styles.eyebrow}>THE IDEA</Text><Text style={styles.h1}>{scene.title}</Text><Text style={styles.body}>{scene.body}</Text></>}
  {scene.kind==='flow'&&<><Text style={styles.eyebrow}>VISUALIZE IT</Text><Text style={styles.h1}>{scene.title}</Text><View style={styles.flow}>{scene.items?.map((x,i)=><Text key={i} style={x==='↓'||x==='⚡'?styles.arrow:styles.flowItem}>{x}</Text>)}</View></>}
  {scene.kind==='code'&&<><Text style={styles.eyebrow}>SEE IT</Text><Text style={styles.h1}>{scene.title}</Text><View style={styles.code}><Text style={styles.codeText}>{scene.code}</Text></View></>}
  {scene.kind==='summary'&&<><Text style={styles.eyebrow}>REMEMBER THIS</Text><Text style={styles.h1}>{scene.title}</Text><View style={styles.summary}><Text style={styles.summaryText}>{scene.body}</Text></View></>}
  {scene.kind==='quiz'&&<Quiz scene={scene}/>}
 </Animated.View>
}

function Quiz({scene}:{scene:Scene}){const [selected,setSelected]=useState<number|null>(null);return <View><Text style={styles.eyebrow}>QUICK CHECK</Text><Text style={styles.h1}>{scene.question}</Text>{scene.options?.map((o,i)=>{const correct=selected!==null&&i===scene.answer;return <Pressable key={i} disabled={selected!==null} onPress={()=>setSelected(i)} style={[styles.option,selected===i&&styles.optionChosen,correct&&styles.optionCorrect]}><Text style={styles.optionText}>{o}</Text>{correct&&<Ionicons name="checkmark-circle" size={22} color={C.green}/>}</Pressable>})}{selected!==null&&<Text style={[styles.feedback,{color:selected===scene.answer?C.green:C.yellow}]}>{selected===scene.answer?'✓ Correct! +10 XP':'Not quite — review the explanation above.'}</Text>}</View>}

function Card({lesson,saved,liked,onSave,onLike,onComplete,height}:{lesson:Lesson;saved:boolean;liked:boolean;onSave:()=>void;onLike:()=>void;onComplete:()=>void;height:number}){
 const [scene,setScene]=useState(0); const [paused,setPaused]=useState(false); const [heartBurst,setHeartBurst]=useState(false);
 const completedRef=useRef(false); const lastTapRef=useRef(0); const touchStartRef=useRef(0); const touchMovedRef=useRef(false);
 useEffect(()=>{setScene(0);setPaused(false);completedRef.current=false},[lesson.id]);
 const goPrev=()=>setScene(s=>Math.max(0,s-1));
 const goNext=()=>setScene(s=>{const next=Math.min(lesson.scenes.length-1,s+1);if(next===lesson.scenes.length-1&&!completedRef.current){completedRef.current=true;onComplete()}return next});
 const handleTap=()=>{const now=Date.now();if(now-lastTapRef.current<320){lastTapRef.current=0;onLike();setHeartBurst(true);setTimeout(()=>setHeartBurst(false),650)}else lastTapRef.current=now};
 const panResponder=useRef(PanResponder.create({
  onStartShouldSetPanResponder:()=>false,
  // Only claim clearly horizontal gestures; let the parent FlatList own vertical scrolling.
  onMoveShouldSetPanResponder:(_,g)=>Math.abs(g.dx)>24&&Math.abs(g.dx)>Math.abs(g.dy),
  onPanResponderRelease:(_,g)=>{if(g.dx<-40)goNext();else if(g.dx>40)goPrev()}
 })).current;
 const onTouchStart=()=>{touchStartRef.current=Date.now();touchMovedRef.current=false};
 const onTouchMove=()=>{touchMovedRef.current=true};
 const onTouchEnd=()=>{const duration=Date.now()-touchStartRef.current;if(touchMovedRef.current)return;if(duration>=450){setPaused(true);return}if(paused){setPaused(false);return}handleTap()};
 const shareLesson=async()=>{try{await Share.share({message:lesson.title+' — '+lesson.subtitle+'\nLearn it on ByteLearn.'})}catch{}};
 return <View style={[styles.lesson,{height}]} {...panResponder.panHandlers} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
  <View style={styles.orb}/><View style={styles.lessonTop}><Text style={styles.category}>{lesson.tag}</Text><Text style={styles.counter}>{scene+1}/{lesson.scenes.length}</Text></View>
  <Scene scene={lesson.scenes[scene]} active={!paused}/>
  {heartBurst&&<View pointerEvents="none" style={styles.heartBurst}><Ionicons name="heart" size={92} color={C.pink}/></View>}
  {paused&&<View pointerEvents="none" style={styles.paused}><Ionicons name="pause" size={22} color={C.text}/><Text style={styles.pausedText}>Paused</Text></View>}
  <Pressable accessibilityLabel="Previous slide" onPress={goPrev} disabled={scene===0} style={[styles.slideArrow,styles.slideArrowLeft,scene===0&&styles.slideArrowDisabled]}><Ionicons name="chevron-back" size={24} color={C.text}/></Pressable>
  <Pressable accessibilityLabel="Next slide" onPress={goNext} disabled={scene===lesson.scenes.length-1} style={[styles.slideArrow,styles.slideArrowRight,scene===lesson.scenes.length-1&&styles.slideArrowDisabled]}><Ionicons name="chevron-forward" size={24} color={C.text}/></Pressable>
  <View style={styles.side}>
   <Pressable accessibilityLabel={liked?'Unlike lesson':'Like lesson'} onPress={onLike} style={styles.actionButton}><Ionicons name={liked?'heart':'heart-outline'} size={31} color={liked?C.pink:C.text}/><Text style={styles.actionLabel}>Like</Text></Pressable>
   <Pressable accessibilityLabel={saved?'Unsave lesson':'Save lesson'} onPress={onSave} style={styles.actionButton}><Ionicons name={saved?'bookmark':'bookmark-outline'} size={30} color={C.text}/><Text style={styles.actionLabel}>Save</Text></Pressable>
   <Pressable accessibilityLabel="Share lesson" onPress={shareLesson} style={styles.actionButton}><Ionicons name="share-outline" size={30} color={C.text}/><Text style={styles.actionLabel}>Share</Text></Pressable>
  </View>
  <View style={styles.bottom}><Text style={styles.title}>{lesson.title}</Text><Text style={styles.subtitle}>{lesson.subtitle}</Text><View style={styles.progress}><View style={[styles.fill,{width:((scene+1)/lesson.scenes.length)*100+'%'}]}/></View></View>
 </View>
}
export default function App(){
 const [feedHeight,setFeedHeight]=useState(H);
 const [logged,setLogged]=useState(false),[name,setName]=useState(''),[screen,setScreen]=useState('learn'),[feedMode,setFeedMode]=useState<'forYou'|'fresh'>('forYou'),[interests,setInterests]=useState<string[]>(['AI','Programming']),[completed,setCompleted]=useState<string[]>([]),[saved,setSaved]=useState<string[]>([]),[liked,setLiked]=useState<string[]>([]),[query,setQuery]=useState(''),[pro,setPro]=useState(false),[lessonFeed,setLessonFeed]=useState<Lesson[]>(lessons),[userId,setUserId]=useState<string|null>(null),[backendReady,setBackendReady]=useState(false);
 useEffect(()=>{AsyncStorage.getItem('bytelearn_state').then(x=>{if(x){const d=JSON.parse(x);setLogged(!!d.logged);setName(d.name||'');setInterests(d.interests||['AI','Programming']);setCompleted(d.completed||[]);setSaved(d.saved||[]);setLiked(d.liked||[]);setPro(!!d.pro)}})},[]);
 useEffect(()=>{AsyncStorage.setItem('bytelearn_state',JSON.stringify({logged,name,interests,completed,saved,liked,pro}))},[logged,name,interests,completed,saved,liked,pro]);

 useEffect(()=>{
  if(!hasSupabaseConfig || !supabase) return;
  let mounted=true;
  (async()=>{
   try{
    let {data:{session}}=await supabase.auth.getSession();
    if(!session){
     const auth=await supabase.auth.signInAnonymously();
     session=auth.data.session;
    }
    if(!session?.user || !mounted) return;
    const uid=session.user.id;
    setUserId(uid);
    const [lessonRes,profileRes,interactionRes]=await Promise.all([
     supabase.from('lessons').select('id,category,title,subtitle,tag,scenes').eq('published',true).order('created_at',{ascending:false}),
     supabase.from('profiles').select('display_name,interests,xp,is_pro').eq('id',uid).maybeSingle(),
     supabase.from('user_lessons').select('lesson_id,completed,liked,saved').eq('user_id',uid)
    ]);
    if(lessonRes.data?.length){
     setLessonFeed(lessonRes.data.map((l:any)=>({...l,scenes:l.scenes as Scene[]})));
    }
    if(profileRes.data){
     setName(profileRes.data.display_name||'');
     setInterests(profileRes.data.interests?.length?profileRes.data.interests:['AI','Programming']);
     setPro(!!profileRes.data.is_pro);
     setLogged(true);
    }
    if(interactionRes.data){
     setCompleted(interactionRes.data.filter((x:any)=>x.completed).map((x:any)=>x.lesson_id));
     setSaved(interactionRes.data.filter((x:any)=>x.saved).map((x:any)=>x.lesson_id));
     setLiked(interactionRes.data.filter((x:any)=>x.liked).map((x:any)=>x.lesson_id));
    }
    setBackendReady(true);
   }catch(e){console.warn('Supabase bootstrap failed; using local mode.',e)}
  })();
  return()=>{mounted=false};
 },[]);

 const persistProfile=async(nextName=name,nextInterests=interests,nextPro=pro)=>{
  if(!supabase || !userId) return;
  await supabase.from('profiles').upsert({
   id:userId,display_name:nextName,interests:nextInterests,xp:completed.length*10,is_pro:nextPro
  });
 };

 const startLearning=async()=>{
  if(!name.trim()) return;
  setLogged(true);
  await persistProfile(name.trim(),interests,pro);
 };

 const toggleSaved=async(lessonId:string)=>{
  const next=!saved.includes(lessonId);
  setSaved(s=>next?[...s,lessonId]:s.filter(x=>x!==lessonId));
  if(supabase && userId) await supabase.from('user_lessons').upsert({user_id:userId,lesson_id:lessonId,saved:next},{onConflict:'user_id,lesson_id'});
 };

 const toggleLiked=async(lessonId:string)=>{
  const next=!liked.includes(lessonId);
  setLiked(s=>next?[...s,lessonId]:s.filter(x=>x!==lessonId));
  if(supabase && userId) await supabase.from('user_lessons').upsert({user_id:userId,lesson_id:lessonId,liked:next},{onConflict:'user_id,lesson_id'});
 };

 const completeLesson=async(lessonId:string)=>{
  if(completed.includes(lessonId)) return;
  setCompleted(s=>s.includes(lessonId)?s:[...s,lessonId]);
  if(supabase && userId){
   await supabase.from('user_lessons').upsert({
    user_id:userId,lesson_id:lessonId,completed:true,progress:100,completed_at:new Date().toISOString()
   },{onConflict:'user_id,lesson_id'});
   await supabase.from('profiles').update({xp:(completed.length+1)*10}).eq('id',userId);
  }
 };

 const feed=useMemo(()=>lessonFeed.filter(l=>interests.includes(l.category)||l.category==='AI'),[lessonFeed,interests]);
 const fresh=useMemo(()=>[...lessonFeed].reverse(),[lessonFeed]);
 const data=screen==='learn'?(feedMode==='forYou'?feed:fresh):screen==='saved'?lessonFeed.filter(l=>saved.includes(l.id)):lessonFeed.filter(l=>(l.title+' '+l.subtitle+' '+l.category).toLowerCase().includes(query.toLowerCase()));
 if(!logged)return <SafeAreaView style={styles.auth}><StatusBar barStyle="light-content"/><Logo/><Text style={styles.authTitle}>Learn tech.<Text style={{color:C.accent}}> One swipe</Text> at a time.</Text><Text style={styles.authSub}>Animated micro-lessons on AI, programming, cloud and system design.</Text><TextInput value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor="#666875" style={styles.input}/><Pressable style={styles.primary} onPress={startLearning}><Text style={styles.primaryText}>Start learning →</Text></Pressable><Text style={styles.small}>{hasSupabaseConfig?'Your progress will sync across sessions.':'Demo mode: add Supabase credentials to sync your progress.'}</Text></SafeAreaView>;
 return <SafeAreaView style={styles.app} onLayout={e=>setFeedHeight(e.nativeEvent.layout.height)}><StatusBar barStyle="light-content"/><View style={styles.header}><Logo/><View style={styles.feedTabs}><Pressable onPress={()=>setFeedMode("forYou")}><Text style={feedMode==="forYou"?styles.feedTabActive:styles.feedTab}>For You</Text></Pressable><Pressable onPress={()=>setFeedMode("fresh")}><Text style={feedMode==="fresh"?styles.feedTabActive:styles.feedTab}>Fresh</Text></Pressable></View><View style={styles.xp}><Ionicons name="flash" size={14} color={C.yellow}/><Text style={styles.xpText}>{completed.length*10}</Text></View></View>{screen==='search'&&<TextInput autoFocus value={query} onChangeText={setQuery} placeholder="Search RAG, Docker, API..." placeholderTextColor="#666875" style={styles.search}/>} {screen==='profile'?<Profile name={name} completed={completed.length} pro={pro} setPro={setPro} interests={interests} setInterests={(next)=>{setInterests(next);persistProfile(name,next,pro)}} logout={async()=>{setLogged(false);if(supabase) await supabase.auth.signOut()}}/>:<FlatList data={data} keyExtractor={x=>x.id} pagingEnabled snapToInterval={feedHeight} decelerationRate="fast" disableIntervalMomentum showsVerticalScrollIndicator={false} bounces={false} overScrollMode="never" style={{flex:1}} renderItem={({item})=><Card height={feedHeight} lesson={item} saved={saved.includes(item.id)} liked={liked.includes(item.id)} onSave={()=>toggleSaved(item.id)} onLike={()=>toggleLiked(item.id)} onComplete={()=>completeLesson(item.id)}/>} /> }<View style={styles.nav}>{[['learn','play-circle','Home'],['search','search','Explore'],['saved','bookmark','Saved'],['profile','person','You']].map(([s,icon,label])=><Pressable key={s} onPress={()=>{setScreen(s);setQuery('')}} style={styles.navItem}><Ionicons name={icon as any} size={24} color={screen===s?C.text:'#676975'}/><Text style={[styles.navText,screen===s&&{color:C.text}]}>{label}</Text></Pressable>)}</View></SafeAreaView>
}

function Profile({name,completed,pro,setPro,interests,setInterests,logout}:{name:string;completed:number;pro:boolean;setPro:(x:boolean)=>void;interests:string[];setInterests:(x:string[])=>void;logout:()=>void}){return <View style={styles.profile}><Text style={styles.profileKicker}>YOUR LEARNING</Text><Text style={styles.profileName}>{name}</Text><View style={styles.stats}><View style={styles.stat}><Text style={styles.statN}>{completed}</Text><Text style={styles.statL}>Lessons</Text></View><View style={styles.stat}><Text style={styles.statN}>{completed*10}</Text><Text style={styles.statL}>XP</Text></View><View style={styles.stat}><Text style={styles.statN}>🔥</Text><Text style={styles.statL}>Keep going</Text></View></View><Text style={styles.section}>TOPICS</Text><View style={styles.chips}>{categories.map(c=><Pressable key={c} onPress={()=>setInterests(interests.includes(c)?interests.filter(x=>x!==c):[...interests,c])} style={[styles.chip,interests.includes(c)&&styles.chipOn]}><Text style={styles.chipText}>{c}</Text></Pressable>)}</View><Text style={styles.section}>BYTELEARN PRO</Text><View style={styles.proCard}><Text style={styles.proTitle}>{pro?'PRO ACTIVE':'Learn without limits'}</Text><Text style={styles.proBody}>No ads · advanced lessons · personalized paths · offline learning</Text><Pressable style={styles.proButton} onPress={()=>setPro(true)}><Text style={styles.primaryText}>{pro?'Subscribed':'₹599 / year'}</Text></Pressable></View><Pressable onPress={logout} style={styles.logout}><Text style={styles.logoutText}>Log out</Text></Pressable></View>}

const styles=StyleSheet.create({app:{flex:1,backgroundColor:C.bg},auth:{flex:1,backgroundColor:C.bg,padding:28,justifyContent:'center'},logo:{fontSize:20,fontWeight:'900',letterSpacing:2,color:C.text},authTitle:{fontSize:42,lineHeight:48,fontWeight:'900',color:C.text,marginTop:55},authSub:{fontSize:17,lineHeight:25,color:C.muted,marginTop:18,marginBottom:22},input:{backgroundColor:C.card,borderRadius:14,padding:16,color:C.text,fontSize:16,borderWidth:1,borderColor:'#22242D'},primary:{backgroundColor:C.accent,borderRadius:14,padding:17,alignItems:'center',marginTop:12},primaryText:{color:'#fff',fontWeight:'800',fontSize:16},small:{color:'#666875',textAlign:'center',marginTop:18,lineHeight:19},header:{position:'absolute',zIndex:5,top:8,left:18,right:18,flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:4},feedTabs:{position:'absolute',left:0,right:0,flexDirection:'row',justifyContent:'center',gap:18},feedTabActive:{color:C.text,fontWeight:'900',fontSize:14},feedTab:{color:'#666875',fontWeight:'700',fontSize:14},xp:{flexDirection:'row',alignItems:'center',backgroundColor:'#12131A',paddingHorizontal:10,paddingVertical:6,borderRadius:16},xpText:{color:C.text,fontWeight:'800',marginLeft:4},lesson:{width:W,paddingHorizontal:25,paddingTop:55,paddingBottom:95,overflow:'hidden'},orb:{position:'absolute',width:280,height:280,borderRadius:140,backgroundColor:'#17122B',right:-100,top:90},lessonTop:{flexDirection:'row',justifyContent:'space-between'},category:{color:C.cyan,fontSize:12,fontWeight:'900',letterSpacing:2},counter:{color:'#676975',fontWeight:'700'},eyebrow:{color:C.accent,fontWeight:'900',letterSpacing:2,fontSize:12,marginBottom:14},big:{fontSize:50,lineHeight:54,fontWeight:'900',color:C.text},h1:{fontSize:35,lineHeight:41,fontWeight:'900',color:C.text,marginBottom:18},body:{fontSize:20,lineHeight:30,color:'#D5D6DD'},flow:{backgroundColor:C.card,borderRadius:24,padding:22,borderWidth:1,borderColor:'#20222C'},flowItem:{color:C.text,fontSize:21,fontWeight:'800',paddingVertical:7},arrow:{color:C.accent,fontSize:20,textAlign:'center',paddingVertical:2},code:{backgroundColor:'#0D0E13',borderRadius:18,padding:20,borderWidth:1,borderColor:'#292B38'},codeText:{color:C.cyan,fontFamily:'monospace',fontSize:16,lineHeight:25},summary:{backgroundColor:'#17122B',borderRadius:24,padding:24,borderWidth:1,borderColor:'#30285B'},summaryText:{color:C.text,fontSize:23,lineHeight:32,fontWeight:'700'},option:{backgroundColor:C.card,borderRadius:15,padding:17,marginBottom:10,flexDirection:'row',justifyContent:'space-between',alignItems:'center',borderWidth:1,borderColor:'#252732'},optionChosen:{borderColor:C.accent},optionCorrect:{borderColor:C.green},optionText:{color:C.text,fontSize:16,fontWeight:'600',flex:1},feedback:{fontWeight:'800',fontSize:16,marginTop:6},side:{position:'absolute',right:12,bottom:138,gap:18,alignItems:'center'},actionButton:{alignItems:'center',minWidth:48},actionLabel:{color:C.text,fontSize:10,fontWeight:'700',marginTop:3},heartBurst:{position:'absolute',left:0,right:0,top:0,bottom:0,alignItems:'center',justifyContent:'center',zIndex:8},paused:{position:'absolute',top:'48%',left:'50%',marginLeft:-50,marginTop:-20,backgroundColor:'#181922DD',borderRadius:24,paddingHorizontal:16,paddingVertical:10,flexDirection:'row',alignItems:'center',gap:7,zIndex:7},pausedText:{color:C.text,fontWeight:'800'},slideArrow:{position:'absolute',top:'50%',marginTop:-20,width:42,height:42,borderRadius:21,backgroundColor:'#181922',borderWidth:1,borderColor:'#2B2D38',alignItems:'center',justifyContent:'center',zIndex:4},slideArrowLeft:{left:14},slideArrowRight:{right:14},slideArrowDisabled:{opacity:0.25},bottom:{position:'absolute',left:25,right:25,bottom:100},title:{fontSize:23,fontWeight:'900',color:C.text},subtitle:{fontSize:14,color:C.muted,marginTop:5},progress:{height:3,backgroundColor:'#292B34',marginTop:13,borderRadius:3},fill:{height:3,backgroundColor:C.accent,borderRadius:3},nav:{position:'absolute',bottom:0,left:0,right:0,height:78,backgroundColor:'#09090D',borderTopWidth:1,borderTopColor:'#1B1C23',flexDirection:'row',justifyContent:'space-around',paddingTop:10},navItem:{alignItems:'center',width:'25%'},navText:{fontSize:11,color:'#676975',marginTop:4,fontWeight:'700'},search:{position:'absolute',zIndex:6,top:44,left:18,right:18,backgroundColor:C.card,borderRadius:14,padding:13,color:C.text,borderWidth:1,borderColor:'#252732'},profile:{flex:1,padding:25,paddingTop:80},profileKicker:{color:C.muted,fontSize:14,textTransform:'uppercase',letterSpacing:2,fontWeight:'800'},profileName:{color:C.text,fontSize:36,fontWeight:'900',marginTop:5},stats:{flexDirection:'row',marginTop:25,gap:10},stat:{flex:1,backgroundColor:C.card,borderRadius:16,padding:16},statN:{color:C.text,fontSize:25,fontWeight:'900'},statL:{color:C.muted,fontSize:12,marginTop:4},section:{color:C.muted,fontSize:12,fontWeight:'900',letterSpacing:2,marginTop:28,marginBottom:10},chips:{flexDirection:'row',flexWrap:'wrap',gap:8},chip:{borderWidth:1,borderColor:'#2A2C37',borderRadius:20,paddingVertical:9,paddingHorizontal:13},chipOn:{backgroundColor:'#241D3D',borderColor:C.accent},chipText:{color:C.text,fontWeight:'700'},proCard:{backgroundColor:'#17122B',borderRadius:20,padding:20,borderWidth:1,borderColor:'#30285B'},proTitle:{color:C.text,fontSize:20,fontWeight:'900'},proBody:{color:C.muted,lineHeight:21,marginTop:8},proButton:{backgroundColor:C.accent,borderRadius:12,padding:13,alignItems:'center',marginTop:15},logout:{marginTop:20,alignItems:'center'},logoutText:{color:C.pink,fontWeight:'800'}});