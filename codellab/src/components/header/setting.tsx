'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings,
  Palette,
  Code2,
  Keyboard,
  Sun,
  Moon,
  Laptop,
  Monitor,
} from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useTheme } from 'next-themes'
import { useEditorSettingStore } from '@/stores/editor-settings-store'
import { Switch } from "@/components/ui/switch"
import { usePlatform } from "@/hooks/use-platform"
import { Kbd } from '@/components/ui/kbd'

const DOCKVIEW_THEMES = [
  { value: 'dockview-theme-replit', label: 'CodeLab' },
  { value: 'system', label: 'System' },
  { value: 'dockview-theme-abyss', label: 'Abyss' },
  { value: 'dockview-theme-abyss-spaced', label: 'Abyss Spaced' },
  { value: 'dockview-theme-dracula', label: 'Dracula' },
  { value: 'dockview-theme-light-spaced', label: 'Light Spaced' },
]

export const KEY_MAP = {
  mac: {
    cmd: "⌘",
    shift: "⇧",
    alt: "⌥",
    ctrl: "⌃",
    tab: "Tab",
    enter: "↩",
    up: "↑",
    down: "↓",
  },
  windows: {
    cmd: "Ctrl",   // keep Ctrl for shortcuts like Ctrl+C
    win: "⊞",      // ✅ Windows key
    shift: "Shift",
    alt: "Alt",
    ctrl: "Ctrl",
    tab: "Tab",
    enter: "Enter",
    up: "↑",
    down: "↓",
  },
} as const

/* ---------------- Animations ---------------- */

const fadeSlide = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
}

const iconButton = {
  hover: { scale: 1.05, rotate: 1 },
  tap: { scale: 0.95 },
}

/* ---------------- Component ---------------- */

export function SettingsDialog({
}) {
  const { theme, setTheme } = useTheme()
  const editorSettings = useEditorSettingStore()
  const platform = usePlatform()
  const keys = KEY_MAP[platform]
  return (
    <Dialog>
      {/* Trigger */}
      <motion.div variants={iconButton} whileHover="hover" whileTap="tap">
        <DialogTrigger asChild>
          <Button variant="secondary" size="icon" className="bg-muted/40 border cursor-pointer">
            <Settings className="h-5 w-5" />
          </Button>
        </DialogTrigger>
      </motion.div>
      <DialogContent
        className="
        max-w-[960px]
        min-w-[600px]
        min-h-[50dvh]
        max-h-[500px]
    p-0
    overflow-hidden
    rounded-2xl
    border
    bg-background
    shadow-2xl
  "
      >
        <Tabs
          defaultValue="appearance"
          orientation="vertical"
          className=" grid h-full grid-cols-[170px_1fr] bg-muted/50"
        >
          {/* ================= Sidebar ================= */}
          <aside className="h-full border-r bg-muted/40 flex flex-col gap-5 ">
            {/* Fixed header */}
            <div className="h-16 px-6 flex items-center border-b">
              <DialogTitle className="text-lg font-semibold">
                Settings
              </DialogTitle>
            </div>
            <div>
              {/* Navigation */}
              <TabsList className="flex w-full flex-col h-full justify-center gap-1 p-3 bg-transparent">
                {[
                  { value: 'appearance', label: 'Appearance', icon: Palette },
                  { value: 'editor', label: 'Editor', icon: Code2, },
                  { value: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
                ].map(({ value, label, icon: Icon }) => (
                  <TabsTrigger
                    key={value}
                    value={value}

                    className="
              flex items-center gap-3
              px-4 py-3
              rounded-lg
              justify-start
              text-sm font-medium
              data-[state=active]:bg-background
              data-[state=active]:shadow-sm
              disabled:opacity-40
              w-full
            "
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </aside>

          {/* ================= Content ================= */}
          <main className="h-full w-full flex-1 overflow-scroll ">
            <AnimatePresence mode="wait">
              <TabsContent
                key={"appearance"}
                value="appearance"
                className="h-full outline-none "
              >
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="
              h-full
              overflow-y-auto
              p-8
              space-y-10
            "
                >
                  {/* Sticky section header */}
                  <div className="sticky top-0 z-10 ">
                    <h2 className="text-2xl font-semibold">Appearance</h2>
                    <p className="text-muted-foreground">
                      Customize how the app looks.
                    </p>
                  </div>

                  <Separator />

                  {/* Theme section */}
                  <section className="space-y-6">
                    <h3 className="text-lg font-semibold">Theme</h3>

                    <RadioGroup
                      value={theme ?? 'system'}
                      onValueChange={setTheme}
                      className="grid grid-cols-3 gap-4"
                    >
                      {[
                        { value: 'light', title: 'Light', icon: Sun },
                        { value: 'dark', title: 'Dark', icon: Moon },
                        { value: 'system', title: 'System', icon: Monitor },
                      ].map((item) => (
                        <Label
                          key={item.value}
                          htmlFor={`theme-${item.value}`}
                          className="
                      rounded-xl
                      border
                      py-6
                      flex flex-col justify-between
                      cursor-pointer
                      [&:has([data-state=checked])]:ring-2
                      [&:has([data-state=checked])]:ring-primary
                    "
                        >

                          <div className="flex items-center flex-col gap-0">
                            <RadioGroupItem
                              className='hidden'
                              id={`theme-${item.value}`}
                              value={item.value}
                            >
                            </RadioGroupItem>

                            <item.icon className="h-6 w-6" />


                          </div>
                        </Label>
                      ))}
                    </RadioGroup>
                  </section>
                </motion.div>
              </TabsContent>

              <TabsContent key={"editor"} value="editor"
                className="h-full outline-none" >
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="
              h-full
              overflow-y-auto
              p-8
              space-y-10
            "
                >
                  {/* Sticky section header */}
                  <div className="sticky top-0 z-10 ">
                    <h2 className="text-2xl font-semibold">Editor</h2>
                    <p className="text-muted-foreground">
                      Customize how the editor looks.
                    </p>
                  </div>

                  <Separator />

                  {/* Theme section */}
                  <section className="flex flex-col gap-4 h-full relative overflow-scroll">
                    <div className='flex justify-between items-center'>
                      <span className='font-semibold text-sm'>Font size</span>
                      <div><Select defaultValue={editorSettings.fontSize.toString()} value={editorSettings.fontSize.toString()} onValueChange={(value) => editorSettings.setFontSize(Number(value))}>
                        <SelectTrigger className="w-[85px]">
                          <SelectValue placeholder={editorSettings.fontSize.toString() + "px"} />
                        </SelectTrigger>
                        <SelectContent>
                          {[12, 13, 14, 15, 16, 17, 18, 19, 20, 21].map((size) => (
                            <SelectItem key={size} value={String(size)}>
                              {size}px
                            </SelectItem>
                          ))}

                        </SelectContent>
                      </Select></div>
                    </div>

                    <div className='flex justify-between items-center'>
                      <span className='font-semibold text-sm'>Font ligatures</span>
                      <div>
                        <Switch
                          id="font-ligatures"
                          checked={editorSettings.fontLigatures}
                          onCheckedChange={editorSettings.setFontLigatures}
                        />
                      </div>

                    </div>
{/* 
                    <div className='flex justify-between items-center'>
                      <span className='font-semibold text-sm'>Editor Theme</span>
                      <div>
                        <Select
                          defaultValue={editorSettings.editorTheme}
                          value={editorSettings.editorTheme}
                          onValueChange={editorSettings.setEditorTheme}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select theme" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="vs-dark">VS Dark</SelectItem>
                            <SelectItem value="vs-light">VS Light</SelectItem>
                            <SelectItem value="hc-black">High Contrast</SelectItem>
                            <SelectItem value="leetcode-dark">LeetCode Dark</SelectItem>
                            <SelectItem value="leetcode-light">LeetCode Light</SelectItem>
                            <SelectItem value="Dracula">Dracula</SelectItem>
                            <SelectItem value="Monokai">Monokai</SelectItem>
                            <SelectItem value="Night Owl">Night Owl</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div> */}

                    <div className='flex justify-between items-center'>
                      <span className='font-semibold text-sm'>Theme</span>
                      <div>
                        <Select
                          defaultValue={editorSettings.dockviewTheme}
                          value={editorSettings.dockviewTheme}
                          onValueChange={editorSettings.setDockviewTheme}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select theme" />
                          </SelectTrigger>
                          <SelectContent>
                            {DOCKVIEW_THEMES.map((theme) => (
                              <SelectItem key={theme.value} value={theme.value}>
                                {theme.label === "Replit" ?  "CodeLab" : theme.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </section>
                </motion.div>
              </TabsContent>

              <TabsContent value="shortcuts">
                <motion.div
                  variants={fadeSlide}
                  initial="hidden"
                  animate="visible"
                  className="p-8 space-y-4 relative h-full overflow-scroll"
                >
                  <div className="sticky top-0 z-10 ">
                    <h2 className="text-2xl font-semibold">Shortcuts</h2>
                    <p className="text-muted-foreground">
                      SpeedUp your task
                    </p>
                  </div>
                  <Separator className='mt-8 mb-8' />
                  <section className="flex flex-col gap-6 h-[330px] relative overflow-scroll">
                    {[
                      ["Indent one level", ["tab"], ["cmd", "]"]],
                      ["Indent one fewer level", ["shift", "tab"], ["cmd", "["]],
                      ["Move lines up / down", ["alt", "up", "down"]],
                      ["Delete line and copy to buffer", ["cmd", "X"]],
                      ["Comment / uncomment current selection", ["cmd", "/"]],

                      ["Undo action", ["cmd", "Z"]],
                      ["Redo action", ["cmd", "shift", "Z"]],

                      ["Copy", ["cmd", "C"]],
                      ["Paste", ["cmd", "V"]],
                      ["Cut", ["cmd", "X"]],
                      ["Format document", ["cmd", "shift", "F"]],
                    ].map(([label, primary, secondary]) => (
                      <div
                        key={label as string}
                        className="flex items-center justify-between gap-4"
                      >
                        <span className="font-semibold text-sm">{label}</span>

                        <div className="flex items-center gap-2">
                          {/* Primary combo */}
                          <div className="flex gap-1">
                            {(primary as string[]).map((k) => (
                              <Kbd key={k}>{(keys as any)[k] ?? k}</Kbd>
                            ))}
                          </div>

                          {/* Secondary combo (optional) */}
                          {secondary && (
                            <>
                              <span className="text-xs text-muted-foreground">or</span>
                              <div className="flex gap-1">
                                {(secondary as string[]).map((k) => (
                                  <Kbd key={k}>{(keys as any)[k] ?? k}</Kbd>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}

                  </section>
                </motion.div>
              </TabsContent>

            </AnimatePresence>
          </main>
        </Tabs>
      </DialogContent>

    </Dialog>
  )
}
