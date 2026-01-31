import Link from "next/link"
import { Code2, Github, Twitter, Linkedin, Mail } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">

        {/* Top Section */}
        <div className="grid grid-cols-1 gap-10 text-center md:grid-cols-4 md:text-left">
          
          {/* Brand */}
          <div className="mx-auto space-y-4 md:mx-0">
            <div className="flex justify-center gap-2 md:justify-start">
              <Code2 className="h-6 w-6" />
              <span className="text-xl font-bold">CodeLab</span>
            </div>
            <p className="mx-auto max-w-sm text-sm text-muted-foreground md:mx-0">
              Collaborative coding platform for developers. Practice, compete, and learn together.
            </p>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h4 className="font-semibold">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/features" className="hover:text-foreground">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-foreground">Pricing</Link></li>
              <li><Link href="/api" className="hover:text-foreground">API</Link></li>
              <li><Link href="/docs" className="hover:text-foreground">Documentation</Link></li>
            </ul>
          </div>

          {/* Community */}
          <div className="space-y-4">
            <h4 className="font-semibold">Community</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/blog" className="hover:text-foreground">Blog</Link></li>
              <li><Link href="/discord" className="hover:text-foreground">Discord</Link></li>
              <li><Link href="/forum" className="hover:text-foreground">Forum</Link></li>
              <li><Link href="/events" className="hover:text-foreground">Events</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="font-semibold">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/help" className="hover:text-foreground">Help Center</Link></li>
              <li><Link href="/contact" className="hover:text-foreground">Contact Us</Link></li>
              <li><Link href="/status" className="hover:text-foreground">Status</Link></li>
              <li><Link href="/privacy" className="hover:text-foreground">Privacy</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 flex flex-col items-center gap-4 border-t pt-6 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} CodeLab. All rights reserved.
          </p>

          <div className="flex gap-4">
            <Link href="https://github.com" aria-label="GitHub">
              <Github className="h-5 w-5" />
            </Link>
            <Link href="https://twitter.com" aria-label="Twitter">
              <Twitter className="h-5 w-5" />
            </Link>
            <Link href="https://linkedin.com" aria-label="LinkedIn">
              <Linkedin className="h-5 w-5" />
            </Link>
            <Link href="mailto:hello@codelab.com" aria-label="Email">
              <Mail className="h-5 w-5" />
            </Link>
          </div>
        </div>

      </div>
    </footer>
  )
}
