export class MarkdownParser{

static async load(path){

const res = await fetch(path)

if(!res.ok)
throw new Error("failed to load markdown")

const text = await res.text()

return marked.parse(text)

}

}
