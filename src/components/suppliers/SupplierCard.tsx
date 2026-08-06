'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SupplierFormDialog } from './SupplierFormDialog';
import { deleteSupplier } from '@/app/actions/suppliers';
import { formError } from '@/lib/form-error';
import { toast } from '@/lib/mutation-toast';
import { useSubmitGuard } from '@/hooks/use-submit-guard';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SupplierCardProps {
  supplier: {
    id: string;
    name: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: string;
    notes?: string;
    _count: { carParts: number };
  };
}

export function SupplierCard({ supplier }: SupplierCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const { loading, run } = useSubmitGuard();
  const router = useRouter();

  const handleDelete = () => {
    void run(async () => {
      setHidden(true);
      setDeleteOpen(false);
      try {
        await deleteSupplier(supplier.id);
        toast.success('Supplier deleted');
        router.refresh();
      } catch (err) {
        setHidden(false);
        toast.error(formError(err));
      }
    });
  };

  if (hidden) return null;

  return (
    <>
      <Card
        className={cn(
          'transition-all hover:border-zinc-700 active:scale-[0.99]',
          loading && 'opacity-50'
        )}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold">{supplier.name}</h3>
              {supplier.contactPerson && (
                <p className="text-sm text-zinc-500">{supplier.contactPerson}</p>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={loading}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  <Pencil className="me-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-500"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="me-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="mt-4 space-y-1 text-sm text-zinc-400">
            {supplier.phone && <p>Phone: {supplier.phone}</p>}
            {supplier.email && <p>Email: {supplier.email}</p>}
          </div>
          <div className="mt-3 border-t border-zinc-800 pt-3">
            <span className="text-xs text-zinc-500">
              {supplier._count.carParts} parts
            </span>
          </div>
        </CardContent>
      </Card>

      <SupplierFormDialog
        supplier={supplier}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete supplier?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {supplier.name} from your suppliers. Parts linked to this
              supplier will be unlinked but not deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
