import { createFileRoute, Link } from "@tanstack/react-router";
import { HeroHeader } from "@/components/hero5-header";
import Cta from "@/components/call-to-action";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ArrowRight } from "lucide-react";
import { blogPosts } from "@/lib/blog-data";

// Reusable Post Card Component
interface PostCardProps {
  post: (typeof blogPosts)[0];
}

function PostCard({ post }: PostCardProps) {
  return (
    <Card className="bg-card/70 backdrop-blur-md shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border border-border/50 overflow-hidden flex flex-col">
      <img
        src={post.imageUrl}
        alt={post.title}
        className="w-full h-48 object-cover"
      />
      <CardHeader>
        <p className="text-sm text-primary font-semibold">{post.category}</p>
        <CardTitle className="text-xl font-bold leading-snug">
          <Link to="/blog/$slug" params={{ slug: post.slug }} className="hover:text-primary transition-colors">
            {post.title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        <p className="text-sm text-muted-foreground flex-grow">{post.excerpt}</p>
        <div className="text-xs text-muted-foreground mt-4">
          By {post.author} • {post.date}
        </div>
      </CardContent>
    </Card>
  );
}

// Blog Listing Page Component
function BlogListing() {
  const featuredPost = blogPosts.find((p) => "featured" in p && p.featured);
  const latestPosts = blogPosts.filter((p) => !("featured" in p) || !p.featured);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Blog Header */}
      <div className="text-center my-16">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
          The Bean Journal Blog
        </h1>
        <p className="text-xl mt-4 max-w-2xl mx-auto text-muted-foreground">
          Insights on mindfulness, productivity, and getting the most out of
          your journaling practice.
        </p>
      </div>

      {/* Featured Post */}
      {featuredPost && (
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 tracking-tight">Featured Post</h2>
          <Card className="grid md:grid-cols-2 gap-8 items-center bg-card/50 backdrop-blur-sm border border-border/30 shadow-lg p-6">
            <img
              src={featuredPost.imageUrl}
              alt={featuredPost.title}
              className="rounded-lg object-cover w-full h-full"
            />
            <div className="flex flex-col justify-center">
              <p className="text-primary font-semibold">{featuredPost.category}</p>
              <h3 className="text-3xl lg:text-4xl font-bold my-3 leading-tight">
                {featuredPost.title}
              </h3>
              <p className="text-muted-foreground mb-6">{featuredPost.excerpt}</p>
              <Link to="/blog/$slug" params={{ slug: featuredPost.slug }} className="font-semibold text-primary hover:underline flex items-center gap-2">
                Read More <ArrowRight size={16} />
              </Link>
            </div>
          </Card>
        </section>
      )}

      {/* Latest Posts */}
      <section>
        <h2 className="text-3xl font-bold mb-8 tracking-tight">Latest Posts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {latestPosts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </section>
    </div>
  );
}

export const Route = createFileRoute("/blog")({
  component: Index,
});

function Index() {
  return (
    <div className="landing-page-theme min-h-screen bg-gradient-to-b from-background via-background to-muted/20 text-foreground relative overflow-x-hidden">
      <HeroHeader />
      <main className="mt-[5rem] pt-16">
        <BlogListing />
      </main>
      <Cta />
      <Footer />
    </div>
  );
}
