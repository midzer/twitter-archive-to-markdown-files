const tweets = require('./tweet')
const dayjs = require('dayjs')
var customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
const matter = require('gray-matter')
const fs = require('fs')

for (t of tweets) {
  
  
  if(
    t.tweet.in_reply_to_user_id_str === undefined && //ignore replies
    !t.tweet.full_text.startsWith('RT @')// && //ignore old style replies
    //t.tweet.entities.media //only include tweets with media.
    ) {

    //extra media
    let allMedia = []
    if(t.tweet.entities.media) {
      for (media of t.tweet.entities.media) {
        let file = media.media_url.substring(media.media_url.lastIndexOf('/') + 1)
        allMedia.push({ url: t.tweet.id + '-' + file })
      }
    }

    //extract links
    let allLinks = []
    if(t.tweet.entities.urls) {
      for (url of t.tweet.entities.urls) {
        allLinks.push(url.expanded_url)
      }
    }

    //extract mentions
    let allMentions = []
    if(t.tweet.entities.user_mentions) {
      for(mention of t.tweet.entities.user_mentions) {
        allMentions.push(`@${mention.screen_name}`)
      }
    }

    const photos = allMedia.length === 0 ? {} : { photos: allMedia }
    const links = allLinks.length === 0 ? {} : { links: allLinks }
    const mentions = allMentions.length === 0 ? {} : { mentions: allMentions }

    //remove any links
    let fileText = t.tweet.full_text//.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '')
    const regex = /(?:https?|ftp):\/\/[\n\S]+/g;
    for (const link of allLinks) {
      fileText = fileText.replace(regex, link);
    }
    fileText = fileText.replace(/(?:http:\/\/t\.co)[\n\S]+/g, '')

    //replace @mentions with linked mentioned
    for (mention of allMentions) {
      fileText = fileText.replace(new RegExp(mention, "gi"), `[${mention}](https://twitter.com/${mention})`)
    }

    let fileContent = matter.stringify(fileText, {
      date: dayjs(t.tweet.created_at).format(),
      ...photos,
      ...links,
      ...mentions,
      url: `/${t.tweet.id}/`
    })
    fs.writeFileSync(`${__dirname}/files/${dayjs(t.tweet.created_at).format('YYYY-MM-DD')}-${t.tweet.id}.md`, fileContent)
  }

  
}