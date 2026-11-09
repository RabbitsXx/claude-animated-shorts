// post.txt for one channel (one file: title, description, AI disclosure, the channel's footer and hashtags, keywords). Never publishes.
export function composePost({title,description='',keywords=[]},channel){
 const t=String(title||'').trim();
 if(!t)throw new Error('title is empty');
 if(t.length>100)throw new Error(`title is ${t.length} characters; YouTube allows 100`);
 return [t,'',String(description).trim(),'',channel.disclosure,'',channel.descriptionFooter,'',channel.hashtags.join(' '),'',keywords.join(', '),''].join('\n');
}
