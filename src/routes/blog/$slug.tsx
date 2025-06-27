import { createFileRoute, Link, notFound, NotFoundError } from "@tanstack/react-router";
import { HeroHeader } from "@/components/hero5-header";
import Cta from "@/components/call-to-action";
import Footer from "@/components/layout/Footer";
import { blogPosts, authors } from "@/lib/blog-data";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/Card";

// Helper to get post and author data
function getPost(slug: string) {
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) throw notFound();

  const author = authors[post.author as keyof typeof authors];
  return { post, author };
}

type PostLoader = Exclude<ReturnType<typeof getPost>, NotFoundError>;

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => getPost(params.slug),
  component: function BlogPostComponent() {
    const { post, author } = Route.useLoaderData() as PostLoader;
    const relatedPosts = blogPosts.filter(p => p.slug !== post.slug).slice(0, 3);
  
    return (
      <div className="landing-page-theme min-h-screen bg-gradient-to-b from-background via-background to-muted/20 text-foreground relative overflow-x-hidden">
        <HeroHeader />
        <main className="mt-[5rem] pt-16">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              {/* Post Header */}
              <div className="mb-8">
                <Link
                  to="/blog"
                  className="text-sm text-primary hover:underline flex items-center gap-2 mb-4"
                >
                  <ArrowLeft size={16} /> Back to Blog
                </Link>
                <p className="text-primary font-semibold">{post.category}</p>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight my-2 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                  {post.title}
                </h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4">
                  <img
                    src={author.avatarUrl}
                    alt={author.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <span>
                    By {author.name} • {post.date} • {post.readTime}
                  </span>
                </div>
              </div>

              {/* Main Image */}
              <img
                src={post.imageUrl}
                alt={post.title}
                className="w-full rounded-lg shadow-lg object-cover mb-8"
              />

              {/* Post Body */}
              <div className="prose prose-lg dark:prose-invert max-w-none mx-auto post-content"
                   dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Divider */}
              <hr className="my-12 border-border/50" />

              {/* Author Bio */}
              <div className="flex items-center gap-6 bg-card/50 p-6 rounded-lg">
                  <img src={author.avatarUrl} alt={author.name} className="w-20 h-20 rounded-full object-cover" />
                  <div>
                      <h4 className="font-bold text-lg">About {author.name}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{author.bio}</p>
                  </div>
              </div>

               {/* Divider */}
               <hr className="my-12 border-border/50" />

              {/* Related Posts */}
              <section>
                  <h2 className="text-3xl font-bold mb-8 tracking-tight">Related Posts</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {relatedPosts.map(p => <RelatedPostCard key={p.slug} post={p} />)}
                  </div>
              </section>
            </div>
          </div>
        </main>
        <Cta />
        <Footer />
      </div>
    );
  }
});

// A simple PostCard for related posts
function RelatedPostCard({ post }: { post: (typeof blogPosts)[0] }) {
    return (
        <Card className="bg-card/70 backdrop-blur-md shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border border-border/50 overflow-hidden">
        <Link to="/blog/$slug" params={{ slug: post.slug }}>
            <img src={post.imageUrl} alt={post.title} className="w-full h-40 object-cover" />
            <div className="p-4">
            <p className="text-sm text-primary font-semibold">{post.category}</p>
            <h3 className="font-bold leading-tight mt-1">{post.title}</h3>
            </div>
        </Link>
        </Card>
    );
} 