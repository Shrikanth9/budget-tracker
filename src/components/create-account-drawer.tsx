"use client";

import React from "react";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { accountSchema } from "@/app/lib/schema";
import { Input } from "./ui/input";
import {
  SelectContent,
  SelectValue,
  SelectItem,
  SelectTrigger,
  Select,
} from "./ui/select";
import { Switch } from "./ui/switch";
import { Button } from "./ui/button";

const CreateAccountDrawer = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: "",
      type: "CURRENT",
      balance: "",
      isDefault: false,
    },
  });

  const onSubmit = async (data: any) => {
    console.log("Form submitted with data:", data);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Create new account</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-4">
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                {" "}
                Account Name{" "}
              </label>
              <Input
                id="name"
                placeholder="e.g., Main Checking"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="type" className="text-sm font-medium">
                {" "}
                Account Type{" "}
              </label>
              <Select onValueChange={(value: any) => setValue("type", value)}>
                <SelectTrigger id="type" className="w-full">
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent defaultValue={"CURRENT"}>
                  <SelectItem value="CURRENT">Current</SelectItem>
                  <SelectItem value="SAVINGS">Savings</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-red-500">{errors.type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                {" "}
                Initial balance{" "}
              </label>
              <Input
                id="balance"
                type="number"
                step={0.01}
                placeholder="e.g., 1000.00"
                {...register("balance")}
              />
              {errors.balance && (
                <p className="text-sm text-red-500">{errors.balance.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-1">
                <label htmlFor="isDefault" className="text-sm font-medium">
                    {" "}
                    Set as default account{" "}
                </label>
                <p className="text-sm text-muted-foreground"> This account will be selected by default for transactions </p>
              </div>
              <Switch
                id="isDefault"
                checked={watch("isDefault")}
                onCheckedChange={(checked) => setValue("isDefault", checked)}
              />
            </div>

            <div className="flex gap-4 pt-4">
                <DrawerClose asChild>
                    <Button type="button" variant="outline" className="flex-1"> 
                        Cancel 
                    </Button>
                </DrawerClose>

                <Button type="submit" className="flex-1">
                    Create Account
                </Button>
            </div>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default CreateAccountDrawer;
