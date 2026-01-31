"use client";

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ArrowRight, Star, Zap, Users } from "lucide-react"
import { motion } from "framer-motion"

export function CTA() {
  return (
    <section className="py-24 sm:py-32 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] -z-10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">

        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            viewport={{ once: true }}
        >
            <Card className="border-primary/20 bg-background/60 backdrop-blur-xl shadow-2xl overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              {/* Header */}
              <CardHeader className="text-center pt-16 pb-8">
                <CardTitle className="text-4xl font-bold sm:text-5xl bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
                  Ready to start coding together?
                </CardTitle>
                <CardDescription className="mt-4 text-xl max-w-2xl mx-auto">
                  Join thousands of developers who are already using CodeLab to improve their coding skills and ace their interviews.
                </CardDescription>
              </CardHeader>

              {/* Content */}
              <CardContent className="flex flex-col items-center gap-8 pb-16">
                
                {/* Actions */}
                <div className="flex flex-col gap-4 sm:flex-row w-full sm:w-auto">
                  <Button size="lg" className="gap-2 h-12 px-8 text-lg shadow-lg hover:shadow-primary/25 transition-all hover:scale-105">
                    Get Started Free
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                  <Button variant="outline" size="lg" className="h-12 px-8 text-lg backdrop-blur-sm hover:bg-primary/5 transition-all hover:scale-105">
                    Schedule Demo
                  </Button>
                </div>

                {/* Trust indicators */}
                <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-sm text-muted-foreground pt-8 border-t border-border/40 w-full max-w-4xl">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    <span className="font-medium">4.9/5 from 2,000+ reviews</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">10,000+ active users</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-purple-500" />
                    <span className="font-medium">Free to start</span>
                  </div>
                </div>

              </CardContent>
            </Card>
        </motion.div>

      </div>
    </section>
  )
}
